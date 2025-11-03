require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const Parser = require('rss-parser');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Add console logging in non-production
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const app = express();
const parser = new Parser({
    timeout: 10000,
    maxRedirects: 5,
});

// User and timestamp tracking constants
const CURRENT_USER = 'tonygeo10';
const getCurrentTimestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

app.use(cors());
app.use(express.json());

// Validate required environment variables
const requiredEnvVars = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

// Database configuration with validation and pooling
const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
};

let pool;

/**
 * Connects to the database with retry mechanism
 * @returns {Promise<void>}
 */
async function connectDB() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            logger.info('🔗 Attempting database connection...');
            pool = await sql.connect(dbConfig);
            logger.info('✅ Connected to SQL Server successfully!');
            return;
        } catch (err) {
            retryCount++;
            logger.error(`❌ Database connection attempt ${retryCount} failed:`, err);
            
            if (retryCount === maxRetries) {
                logger.error('❌ Maximum database connection retries reached');
                throw err;
            }
            
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Parses date string with timezone handling
 * @param {string} dateString - Date string to parse
 * @returns {string} - ISO formatted date string
 */
function parseDate(dateString) {
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }

        // Try parsing various date formats
        const formats = [
            /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
            /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
            /^(\d{1,2}\s+\w+\s+\d{4})/ // DD Month YYYY
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                const parsed = new Date(match[0]);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            }
        }

        throw new Error(`Unable to parse date: ${dateString}`);
    } catch (err) {
        logger.warn('Date parsing failed:', { dateString, error: err.message });
        return new Date().toISOString(); // Fallback to current date
    }
}

// API Routes with improved error handling and pagination
app.get('/api/health', async (req, res) => {
    try {
        if (pool) {
            await pool.request().query('SELECT 1 as status');
            res.json({ status: 'healthy', database: 'connected' });
        } else {
            res.json({ status: 'healthy', database: 'disconnected' });
        }
    } catch (err) {
        logger.error('Health check failed:', err);
        res.status(503).json({ status: 'unhealthy', error: err.message });
    }
});

app.get('/api/aade-news', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * pageSize;

        if (pool) {
            const result = await pool.request()
                .input('pageSize', sql.Int, pageSize)
                .input('offset', sql.Int, offset)
                .query(`
                    SELECT *
                    FROM Articles
                    WHERE FeedID = 1
                    ORDER BY PublishDate DESC
                    OFFSET @offset ROWS
                    FETCH NEXT @pageSize ROWS ONLY
                `);

            const totalCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM Articles WHERE FeedID = 1');

            // Add user and timestamp tracking to articles
            const articlesWithTracking = result.recordset.map(article => ({
                ...article,
                CreatedBy: article.CreatedBy || CURRENT_USER,
                LastModifiedBy: article.LastModifiedBy || CURRENT_USER,
                LastModifiedAt: article.LastModifiedAt || getCurrentTimestamp()
            }));

            res.json({
                articles: articlesWithTracking,
                pagination: {
                    page,
                    pageSize,
                    totalItems: totalCount.recordset[0].total,
                    totalPages: Math.ceil(totalCount.recordset[0].total / pageSize)
                },
                tracking: {
                    user: CURRENT_USER,
                    timestamp: getCurrentTimestamp()
                }
            });
        } else {
            // Fallback to direct RSS fetch with pagination
            const feed = await parser.parseURL('https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss');
            const articles = feed.items.map(item => ({
                title: item.title,
                description: item.contentSnippet || '',
                link: item.link,
                pubDate: parseDate(item.pubDate),
                source: 'rss',
                CreatedBy: CURRENT_USER,
                LastModifiedBy: CURRENT_USER,
                LastModifiedAt: getCurrentTimestamp()
            }));

            const paginatedArticles = articles.slice(offset, offset + pageSize);

            res.json({
                articles: paginatedArticles,
                pagination: {
                    page,
                    pageSize,
                    totalItems: articles.length,
                    totalPages: Math.ceil(articles.length / pageSize)
                },
                tracking: {
                    user: CURRENT_USER,
                    timestamp: getCurrentTimestamp()
                }
            });
        }
    } catch (err) {
        logger.error('Error fetching AADE news:', err);
        res.status(500).json({ 
            error: 'Failed to fetch news', 
            details: err.message 
        });
    }
});

app.get('/api/feeds', async (req, res) => {
    try {
        if (pool) {
            const result = await pool.request().query('SELECT * FROM RSSFeeds WHERE IsActive = 1');
            
            // Add user and timestamp tracking to feeds
            const feedsWithTracking = result.recordset.map(feed => ({
                ...feed,
                LastModifiedBy: feed.LastModifiedBy || CURRENT_USER,
                LastModifiedAt: feed.LastModifiedAt || getCurrentTimestamp()
            }));
            
            res.json({
                feeds: feedsWithTracking,
                tracking: {
                    user: CURRENT_USER,
                    timestamp: getCurrentTimestamp()
                }
            });
        } else {
            res.json({
                feeds: [{
                    FeedID: 1,
                    FeedName: 'AADE - Δελτία Τύπου',
                    FeedURL: 'https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss',
                    Category: 'Tax Authority',
                    CreatedBy: CURRENT_USER,
                    LastModifiedBy: CURRENT_USER,
                    LastModifiedAt: getCurrentTimestamp()
                }],
                tracking: {
                    user: CURRENT_USER,
                    timestamp: getCurrentTimestamp()
                }
            });
        }
    } catch (err) {
        logger.error('Error fetching feeds:', err);
        res.status(500).json({ 
            error: 'Failed to fetch feeds', 
            details: err.message 
        });
    }
});

/**
 * Database schema migration endpoint to add tracking columns
 * This endpoint adds CreatedBy, LastModifiedBy, and LastModifiedAt columns to tables
 * NOTE: This endpoint should be protected with authentication/authorization in production
 */
app.post('/api/migrate-schema', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ 
                error: 'Database not connected',
                message: 'Cannot perform schema migration without database connection'
            });
        }

        const migrations = [];
        
        // Add columns to Articles table if they don't exist
        try {
            await pool.request()
                .input('defaultUser', sql.NVarChar(100), CURRENT_USER)
                .query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Articles') AND name = 'CreatedBy')
                    BEGIN
                        ALTER TABLE Articles ADD CreatedBy NVARCHAR(100) DEFAULT @defaultUser;
                    END
                `);
            migrations.push('Articles.CreatedBy added');
        } catch (err) {
            logger.warn('Articles.CreatedBy migration warning:', err.message);
        }

        try {
            await pool.request()
                .input('defaultUser', sql.NVarChar(100), CURRENT_USER)
                .query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Articles') AND name = 'LastModifiedBy')
                    BEGIN
                        ALTER TABLE Articles ADD LastModifiedBy NVARCHAR(100) DEFAULT @defaultUser;
                    END
                `);
            migrations.push('Articles.LastModifiedBy added');
        } catch (err) {
            logger.warn('Articles.LastModifiedBy migration warning:', err.message);
        }

        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Articles') AND name = 'LastModifiedAt')
                BEGIN
                    ALTER TABLE Articles ADD LastModifiedAt DATETIME DEFAULT GETUTCDATE();
                END
            `);
            migrations.push('Articles.LastModifiedAt added');
        } catch (err) {
            logger.warn('Articles.LastModifiedAt migration warning:', err.message);
        }

        // Add columns to RSSFeeds table if they don't exist
        try {
            await pool.request()
                .input('defaultUser', sql.NVarChar(100), CURRENT_USER)
                .query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RSSFeeds') AND name = 'CreatedBy')
                    BEGIN
                        ALTER TABLE RSSFeeds ADD CreatedBy NVARCHAR(100) DEFAULT @defaultUser;
                    END
                `);
            migrations.push('RSSFeeds.CreatedBy added');
        } catch (err) {
            logger.warn('RSSFeeds.CreatedBy migration warning:', err.message);
        }

        try {
            await pool.request()
                .input('defaultUser', sql.NVarChar(100), CURRENT_USER)
                .query(`
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RSSFeeds') AND name = 'LastModifiedBy')
                    BEGIN
                        ALTER TABLE RSSFeeds ADD LastModifiedBy NVARCHAR(100) DEFAULT @defaultUser;
                    END
                `);
            migrations.push('RSSFeeds.LastModifiedBy added');
        } catch (err) {
            logger.warn('RSSFeeds.LastModifiedBy migration warning:', err.message);
        }

        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RSSFeeds') AND name = 'LastModifiedAt')
                BEGIN
                    ALTER TABLE RSSFeeds ADD LastModifiedAt DATETIME DEFAULT GETUTCDATE();
                END
            `);
            migrations.push('RSSFeeds.LastModifiedAt added');
        } catch (err) {
            logger.warn('RSSFeeds.LastModifiedAt migration warning:', err.message);
        }

        logger.info('Schema migration completed:', migrations);
        res.json({
            success: true,
            migrations,
            timestamp: getCurrentTimestamp(),
            user: CURRENT_USER
        });
    } catch (err) {
        logger.error('Schema migration failed:', err);
        res.status(500).json({ 
            error: 'Schema migration failed', 
            details: err.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    try {
        await connectDB();
    } catch (err) {
        logger.error('Failed to establish initial database connection:', err);
    }
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', {
        promise,
        reason
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
