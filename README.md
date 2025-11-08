# Greek Tax News Hub

A comprehensive RSS news aggregator for Greek tax updates from official sources

## Overview

This application aggregates news from multiple Greek news sources and tax-related RSS feeds, providing a unified interface to access tax updates, legal information, and general news from Greece.

## Features

- **Multiple RSS Feed Sources**: Aggregates content from AADE, TaxHeaven.gr, and major Greek news outlets
- **Flexible API**: RESTful endpoints for accessing individual feeds or all feeds combined
- **Database Storage**: Optional SQL Server integration for persistent storage and faster access
- **Pagination Support**: All endpoints support pagination for efficient data retrieval
- **Automatic Fallback**: Falls back to direct RSS parsing if database is unavailable
- **Error Handling**: Comprehensive error handling and logging with Winston

## API Endpoints

### Health Check
```
GET /api/health
```
Returns the health status of the server and database connection.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Get All Feeds
```
GET /api/feeds
```
Returns all active RSS feed configurations.

**Response:**
```json
[
  {
    "FeedID": 1,
    "FeedName": "AADE - Δελτία Τύπου",
    "FeedURL": "https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss",
    "Category": "Tax Authority",
    "IsActive": true
  },
  ...
]
```

### Get All Articles (from all feeds)
```
GET /api/articles/all?page=1&pageSize=20
```
Returns articles from all active feeds, sorted by publish date.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20): Number of items per page

**Response:**
```json
{
  "articles": [
    {
      "title": "Article Title",
      "description": "Article description",
      "link": "https://...",
      "pubDate": "2023-11-08T10:00:00.000Z",
      "feedName": "AADE - Δελτία Τύπου",
      "category": "Tax Authority",
      "source": "rss"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

### Get Articles by Feed ID
```
GET /api/articles/:feedId?page=1&pageSize=20
```
Returns articles from a specific feed.

**Path Parameters:**
- `feedId`: The ID of the feed (1-12)

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20): Number of items per page

**Response:** Same structure as `/api/articles/all`

### Get AADE News (Legacy Endpoint)
```
GET /api/aade-news?page=1&pageSize=20
```
Returns articles specifically from the AADE feed. This endpoint is maintained for backward compatibility.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20): Number of items per page

## Feed Configuration

Feeds are configured in `backend/config/feeds.json`. Each feed has the following structure:

```json
{
  "FeedID": 1,
  "FeedName": "Display Name",
  "FeedURL": "https://example.com/rss",
  "Category": "Category Name",
  "IsActive": true
}
```

### Available Feeds

**Tax Authority:**
1. AADE - Δελτία Τύπου (Greek Tax Authority Press Releases)

**General News:**
2. Newsbomb.gr
3. Alfavita.gr
4. ERTNews.gr
5. Tanea.gr
6. DNews.gr

**Tax News (TaxHeaven.gr):**
7. New Content
8. Laws
9. Legal Content
10. Data/Info
11. Articles
12. Forum

## Adding New Feeds

To add a new feed, edit `backend/config/feeds.json`:

1. Add a new entry to the `feeds` array
2. Assign a unique `FeedID`
3. Provide a descriptive `FeedName`
4. Set the `FeedURL` to the RSS/XML feed URL
5. Choose an appropriate `Category`
6. Set `IsActive` to `true`

Example:
```json
{
  "FeedID": 13,
  "FeedName": "New Feed Source",
  "FeedURL": "https://example.com/feed.xml",
  "Category": "General News",
  "IsActive": true
}
```

If using the database, also add the feed to the `RSSFeeds` table:
```sql
INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
VALUES (13, 'New Feed Source', 'https://example.com/feed.xml', 'General News', 1);
```

## Database Setup

The application can work with or without a database. If a database is configured, it will be used for caching and faster access. Otherwise, it falls back to direct RSS parsing.

### Schema

Run `backend/sql/schema.sql` to create the required tables:
- `RSSFeeds`: Stores feed configurations
- `Articles`: Stores cached articles with feed relationships

### Environment Variables

Create a `.env` file in the `backend/backend` directory:

```env
DB_SERVER=your-sql-server
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
DB_ENCRYPT=true
PORT=3000
NODE_ENV=development
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend/backend
   npm install
   ```
3. Configure environment variables (optional, for database)
4. Run the server:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

## Technology Stack

- **Backend**: Node.js, Express
- **RSS Parsing**: rss-parser
- **Database**: Microsoft SQL Server (optional)
- **Logging**: Winston
- **CORS**: Enabled for cross-origin requests

## License

MIT

