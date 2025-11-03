require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser({
    timeout: 30000, // 30 second timeout for RSS fetches
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Greek-Tax-News-Hub/1.0'
    }
});

app.use(cors());
app.use(express.json());

// SQL Server Configuration with connection pooling
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'GreekTaxNewsHub',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000, // 30 seconds
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000; // Start with 1 second

/**
 * Connects to the SQL Server database with retry logic and exponential backoff
 * @param {number} attempt - Current connection attempt number
 * @returns {Promise<void>}
 */
async function connectDB(attempt = 0) {
    try {
        console.log(`🔗 Connecting to SQL Server (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
        pool = await sql.connect(dbConfig);
        
        // Set up connection error handlers
        pool.on('error', handlePoolError);
        
        reconnectAttempts = 0; // Reset counter on successful connection
        console.log('✅ Connected to SQL Server successfully!');
        
    } catch (err) {
        console.error(`❌ Database connection failed (attempt ${attempt + 1}):`, err.message);
        
        if (attempt < MAX_RECONNECT_ATTEMPTS - 1) {
            // Calculate exponential backoff delay
            const delay = RECONNECT_DELAY_BASE * Math.pow(2, attempt);
            console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectDB(attempt + 1);
        } else {
            console.error('⚠️ Max reconnection attempts reached. Database will be unavailable.');
            console.error('⚠️ Server will continue running with fallback RSS-only mode.');
        }
    }
}

/**
 * Handles database pool errors and attempts reconnection
 * @param {Error} err - The error that occurred
 */
function handlePoolError(err) {
    console.error('💥 Database pool error:', err.message);
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect to database...`);
        
        // Close existing pool if it exists
        if (pool) {
            pool.close().catch(e => console.error('Error closing pool:', e.message));
            pool = null;
        }
        
        // Attempt reconnection
        connectDB(reconnectAttempts - 1);
    }
}

/**
 * Performs an RSS feed fetch with retry logic
 * @param {string} url - RSS feed URL
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Parsed RSS feed
 */
async function fetchRSSWithRetry(url, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} for ${url}`);
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            }
            
            const rss = await parser.parseURL(url);
            return rss;
            
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ RSS fetch attempt ${attempt + 1} failed for ${url}:`, error.message);
            
            // Don't retry on certain errors
            if (error.message.includes('404') || error.message.includes('Invalid URL')) {
                break;
            }
        }
    }
    
    throw lastError || new Error('RSS fetch failed after retries');
}

/**
 * Formats date to ISO string with timezone handling
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} ISO formatted date string
 */
function formatDateWithTimezone(dateInput) {
    try {
        if (!dateInput) return new Date().toISOString();
        
        const date = new Date(dateInput);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            // Try parsing common date formats
            const formats = [
                // DD/MM/YYYY HH:mm
                /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})/,
                // YYYY-MM-DD
                /(\d{4})-(\d{1,2})-(\d{1,2})/,
            ];
            
            for (const format of formats) {
                const match = dateInput.toString().match(format);
                if (match) {
                    if (format === formats[0]) {
                        // DD/MM/YYYY format
                        const [, day, month, year, hour, minute] = match;
                        return new Date(year, month - 1, day, hour, minute).toISOString();
                    } else if (format === formats[1]) {
                        // YYYY-MM-DD format
                        const [, year, month, day] = match;
                        return new Date(year, month - 1, day).toISOString();
                    }
                }
            }
            
            // If all parsing fails, return current date
            console.warn('⚠️ Date parsing failed, using current date:', dateInput);
            return new Date().toISOString();
        }
        
        return date.toISOString();
    } catch (error) {
        console.error('❌ Date formatting error:', error.message);
        return new Date().toISOString();
    }
}

// API Routes

/**
 * Health check endpoint - verifies server and database status
 * @route GET /api/health
 */
app.get('/api/health', async (req, res) => {
    try {
        if (pool) {
            await pool.request().query('SELECT 1 as status');
            res.json({ status: 'healthy', database: 'connected' });
        } else {
            res.json({ status: 'healthy', database: 'disconnected' });
        }
    } catch (err) {
        console.error('❌ Health check error:', err.message);
        res.json({ status: 'unhealthy', error: err.message });
    }
});

/**
 * Get AADE news articles with pagination support
 * @route GET /api/aade-news
 * @queryparam {number} page - Page number (default: 1)
 * @queryparam {number} limit - Items per page (default: 20, max: 100)
 */
app.get('/api/aade-news', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        
        // If database is connected, get from SQL Server with pagination
        if (pool) {
            try {
                const result = await pool.request()
                    .input('limit', sql.Int, limit)
                    .input('offset', sql.Int, offset)
                    .query(`
                        SELECT * FROM Articles 
                        WHERE FeedID = 1 
                        ORDER BY PublishDate DESC
                        OFFSET @offset ROWS
                        FETCH NEXT @limit ROWS ONLY
                    `);
                
                // Get total count for pagination
                const countResult = await pool.request()
                    .query(`SELECT COUNT(*) as total FROM Articles WHERE FeedID = 1`);
                
                const total = countResult.recordset[0].total;
                
                res.json({ 
                    articles: result.recordset, 
                    source: 'database',
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                });
            } catch (dbError) {
                console.error('❌ Database query error:', dbError.message);
                // Fallback to RSS if database query fails
                throw dbError;
            }
        } else {
            // Fallback: Fetch directly from RSS with retry logic
            const rss = await fetchRSSWithRetry('https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss');
            const articles = rss.items.slice(offset, offset + limit).map(item => ({
                title: item.title,
                description: item.contentSnippet || '',
                link: item.link,
                pubDate: formatDateWithTimezone(item.pubDate),
                source: 'rss'
            }));
            
            res.json({ 
                articles: articles, 
                source: 'rss',
                pagination: {
                    page,
                    limit,
                    total: rss.items.length,
                    totalPages: Math.ceil(rss.items.length / limit)
                }
            });
        }
    } catch (err) {
        console.error('❌ Error fetching AADE news:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch articles',
            message: err.message,
            fallbackAvailable: !pool
        });
    }
});

/**
 * Get all RSS feeds
 * @route GET /api/feeds
 */
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
        console.error('❌ Error fetching feeds:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Article cleanup endpoint - removes old articles based on age
 * @route POST /api/cleanup
 * @bodyparam {number} daysOld - Remove articles older than this many days (default: 90)
 */
app.post('/api/cleanup', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const daysOld = parseInt(req.body.daysOld) || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await pool.request()
            .input('cutoffDate', sql.DateTime, cutoffDate)
            .query(`
                DELETE FROM Articles 
                WHERE PublishDate < @cutoffDate
            `);
        
        console.log(`🧹 Cleaned up ${result.rowsAffected[0]} articles older than ${daysOld} days`);
        
        res.json({ 
            success: true, 
            deletedCount: result.rowsAffected[0],
            cutoffDate: cutoffDate.toISOString()
        });
        
    } catch (err) {
        console.error('❌ Cleanup error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

/**
 * Start the server and connect to the database
 */
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Database: ${dbConfig.server}/${dbConfig.database}`);
    await connectDB();
});
