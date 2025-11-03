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
                    SELECT * FROM (
                        SELECT *, ROW_NUMBER() OVER (ORDER BY PublishDate DESC) as RowNum
                        FROM Articles
                        WHERE FeedID = 1
                    ) AS Paginated
                    WHERE RowNum > @offset AND RowNum <= (@offset + @pageSize)
                `);

            const totalCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM Articles WHERE FeedID = 1');

            res.json({
                articles: result.recordset,
                pagination: {
                    page,
                    pageSize,
                    totalItems: totalCount.recordset[0].total,
                    totalPages: Math.ceil(totalCount.recordset[0].total / pageSize)
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
                source: 'rss'
            }));

            const paginatedArticles = articles.slice(offset, offset + pageSize);

            res.json({
                articles: paginatedArticles,
                pagination: {
                    page,
                    pageSize,
                    totalItems: articles.length,
                    totalPages: Math.ceil(articles.length / pageSize)
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
            res.json(result.recordset);
        } else {
            res.json([{
                FeedID: 1,
                FeedName: 'AADE - Δελτία Τύπου',
                FeedURL: 'https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss',
                Category: 'Tax Authority'
            }]);
        }
    } catch (err) {
        logger.error('Error fetching feeds:', err);
        res.status(500).json({ 
            error: 'Failed to fetch feeds', 
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
