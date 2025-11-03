require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const Parser = require('rss-parser');
const winston = require('winston');
const axios = require('axios');

const app = express();

// Winston logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// RSS Parser with custom configuration
const parser = new Parser({
    timeout: parseInt(process.env.RSS_TIMEOUT) || 10000,
    maxRedirects: 5,
    customFields: {
        item: [
            ['dc:date', 'dcDate'],
            ['pubDate', 'pubDate'],
            ['published', 'published'],
            ['updated', 'updated']
        ]
    }
});

app.use(cors());
app.use(express.json());

// Environment variable validation
function validateEnvironment() {
    const required = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        logger.warn(`Missing environment variables: ${missing.join(', ')}. Using defaults.`);
    }
}

// SQL Server Configuration with connection pooling
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'GreekTaxNewsHub',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 0,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
    },
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 15000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 15000
};

let pool;

// Database connection with retry mechanism
async function connectDB(retryCount = 0) {
    const maxRetries = parseInt(process.env.DB_MAX_RETRIES) || 5;
    const retryDelay = parseInt(process.env.DB_RETRY_DELAY) || 1000;
    
    try {
        logger.info('🔗 Connecting to SQL Server...');
        pool = await sql.connect(dbConfig);
        logger.info('✅ Connected to SQL Server successfully!');
        return pool;
    } catch (err) {
        logger.error('❌ Database connection failed', {
            error: err.message,
            retryCount,
            maxRetries
        });
        
        if (retryCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, retryCount);
            logger.info(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectDB(retryCount + 1);
        }
        
        logger.error('Max retries reached. Database will not be available.');
        return null;
    }
}

// Helper function to parse dates with multiple formats
function parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    // Try parsing as ISO string first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }
    
    // Try common date formats
    const formats = [
        // RFC 2822
        /^[A-Za-z]{3},\s\d{1,2}\s[A-Za-z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2}\s[+-]\d{4}$/,
        // ISO 8601 variants
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    ];
    
    for (const format of formats) {
        if (format.test(dateStr)) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    
    logger.warn(`Could not parse date: ${dateStr}, using current date`);
    return new Date();
}

// Helper function to clean HTML from descriptions
function cleanDescription(description) {
    if (!description) return '';
    
    return description
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
        .substring(0, 500); // Limit to 500 characters
}

// Helper function to fetch RSS with retry and timeout
async function fetchRSSWithRetry(url, retryCount = 0) {
    const maxRetries = parseInt(process.env.RSS_MAX_RETRIES) || 3;
    const timeout = parseInt(process.env.RSS_TIMEOUT) || 10000;
    
    try {
        logger.info(`Fetching RSS feed: ${url}`);
        
        // First, validate the URL is accessible
        const response = await axios.get(url, {
            timeout,
            validateStatus: (status) => status === 200
        });
        
        // Validate XML content
        if (!response.data || typeof response.data !== 'string') {
            throw new Error('Invalid RSS response: not a string');
        }
        
        if (!response.data.includes('<rss') && !response.data.includes('<feed')) {
            throw new Error('Invalid RSS/Atom feed: missing root element');
        }
        
        // Parse the RSS feed
        const feed = await parser.parseString(response.data);
        return feed;
    } catch (err) {
        logger.error(`RSS fetch failed (attempt ${retryCount + 1}/${maxRetries + 1})`, {
            url,
            error: err.message
        });
        
        if (retryCount < maxRetries) {
            const delay = 1000 * Math.pow(2, retryCount);
            logger.info(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchRSSWithRetry(url, retryCount + 1);
        }
        
        throw err;
    }
}

// API Routes
app.get('/api/health', async (req, res) => {
    try {
        if (pool) {
            await pool.request().query('SELECT 1 as status');
            res.json({ status: 'healthy', database: 'connected' });
        } else {
            res.json({ status: 'healthy', database: 'disconnected' });
        }
    } catch (err) {
        logger.error('Health check failed', { error: err.message });
        res.json({ status: 'unhealthy', error: err.message });
    }
});

app.get('/api/aade-news', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * pageSize;
        
        // If database is connected, get from SQL Server
        if (pool) {
            const countResult = await pool.request()
                .input('feedId', sql.Int, 1)
                .query('SELECT COUNT(*) as total FROM Articles WHERE FeedID = @feedId');
            
            const total = countResult.recordset[0].total;
            const totalPages = Math.ceil(total / pageSize);
            
            const result = await pool.request()
                .input('feedId', sql.Int, 1)
                .input('pageSize', sql.Int, pageSize)
                .input('offset', sql.Int, offset)
                .query(`SELECT * FROM Articles 
                       WHERE FeedID = @feedId 
                       ORDER BY PublishDate DESC
                       OFFSET @offset ROWS
                       FETCH NEXT @pageSize ROWS ONLY`);
            
            res.json({
                articles: result.recordset,
                pagination: {
                    currentPage: page,
                    pageSize: pageSize,
                    totalPages: totalPages,
                    totalItems: total
                },
                source: 'database'
            });
        } else {
            // Fallback: Fetch directly from RSS
            const rss = await fetchRSSWithRetry('https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss');
            
            const allArticles = rss.items.map(item => ({
                title: item.title || 'Untitled',
                description: cleanDescription(item.contentSnippet || item.description || ''),
                link: item.link || '',
                pubDate: parseDate(item.pubDate || item.dcDate || item.published || item.updated)
            }));
            
            // Sort by date descending
            allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            
            // Paginate
            const total = allArticles.length;
            const totalPages = Math.ceil(total / pageSize);
            const paginatedArticles = allArticles.slice(offset, offset + pageSize);
            
            res.json({
                articles: paginatedArticles,
                pagination: {
                    currentPage: page,
                    pageSize: pageSize,
                    totalPages: totalPages,
                    totalItems: total
                },
                source: 'rss'
            });
        }
    } catch (err) {
        logger.error('Failed to fetch articles', {
            error: err.message,
            stack: err.stack
        });
        res.status(500).json({
            error: 'Failed to fetch articles',
            message: err.message
        });
    }
});

app.get('/api/feeds', async (req, res) => {
    try {
        if (pool) {
            const result = await pool.request().query('SELECT * FROM RSSFeeds WHERE IsActive = 1');
            res.json(result.recordset);
        } else {
            res.json([
                {
                    FeedID: 1,
                    FeedName: 'AADE - Δελτία Τύπου',
                    FeedURL: 'https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss',
                    Category: 'Tax Authority'
                }
            ]);
        }
    } catch (err) {
        logger.error('Failed to fetch feeds', { error: err.message });
        res.status(500).json({
            error: 'Failed to fetch feeds',
            message: err.message
        });
    }
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    // Give time for logging before exit
    setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    if (pool) {
        await pool.close();
        logger.info('Database pool closed');
    }
    process.exit(0);
});

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    validateEnvironment();
    await connectDB();
});
