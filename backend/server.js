require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

// SQL Server Configuration
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'GreekTaxNewsHub',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let pool;

async function connectDB() {
    try {
        console.log('🔗 Connecting to SQL Server...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server successfully!');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
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
        res.json({ status: 'unhealthy', error: err.message });
    }
});

app.get('/api/aade-news', async (req, res) => {
    try {
        // If database is connected, get from SQL Server
        if (pool) {
            const result = await pool.request()
                .query(`SELECT TOP 20 * FROM Articles 
                       WHERE FeedID = 1 
                       ORDER BY PublishDate DESC`);
            res.json({ articles: result.recordset, source: 'database' });
        } else {
            // Fallback: Fetch directly from RSS
            const rss = await parser.parseURL('https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss');
            const articles = rss.items.map(item => ({
                title: item.title,
                description: item.contentSnippet || '',
                link: item.link,
                pubDate: item.pubDate,
                source: 'rss'
            }));
            res.json({ articles: articles, source: 'rss' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await connectDB();
});
