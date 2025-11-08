-- Greek Tax News Hub Database Schema
-- This schema defines the structure for storing RSS feed configurations and articles

-- =====================================================
-- Table: RSSFeeds
-- Description: Stores RSS feed source configurations
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RSSFeeds' AND xtype='U')
BEGIN
    CREATE TABLE RSSFeeds (
        FeedID INT PRIMARY KEY IDENTITY(1,1),
        FeedName NVARCHAR(255) NOT NULL,
        FeedURL NVARCHAR(1000) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_FeedURL UNIQUE (FeedURL)
    );

    -- Create index for active feeds lookup
    CREATE INDEX IX_RSSFeeds_IsActive ON RSSFeeds(IsActive);
    CREATE INDEX IX_RSSFeeds_Category ON RSSFeeds(Category);
END
GO

-- =====================================================
-- Table: Articles
-- Description: Stores articles fetched from RSS feeds
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Articles' AND xtype='U')
BEGIN
    CREATE TABLE Articles (
        ArticleID INT PRIMARY KEY IDENTITY(1,1),
        FeedID INT NOT NULL,
        Title NVARCHAR(500) NOT NULL,
        Description NVARCHAR(MAX),
        Link NVARCHAR(1000) NOT NULL,
        PublishDate DATETIME2 NOT NULL,
        FetchedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        Source NVARCHAR(50) DEFAULT 'rss',
        CONSTRAINT FK_Articles_RSSFeeds FOREIGN KEY (FeedID) 
            REFERENCES RSSFeeds(FeedID) ON DELETE CASCADE,
        CONSTRAINT UQ_Article_Link UNIQUE (Link)
    );

    -- Create indexes for performance
    CREATE INDEX IX_Articles_FeedID ON Articles(FeedID);
    CREATE INDEX IX_Articles_PublishDate ON Articles(PublishDate DESC);
    CREATE INDEX IX_Articles_FeedID_PublishDate ON Articles(FeedID, PublishDate DESC);
    CREATE INDEX IX_Articles_FetchedAt ON Articles(FetchedAt DESC);
END
GO

-- =====================================================
-- Insert Default Feed Data
-- =====================================================
-- Only insert if the table is empty
IF NOT EXISTS (SELECT 1 FROM RSSFeeds)
BEGIN
    SET IDENTITY_INSERT RSSFeeds ON;

    -- AADE Feed (existing)
    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (1, 'AADE - Δελτία Τύπου', 'https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss', 'Tax Authority', 1);

    -- Greek News Feeds
    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (2, 'Newsbomb.gr', 'https://www.newsbomb.gr/?format=feed&type=rss', 'General News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (3, 'Alfavita.gr', 'https://www.alfavita.gr/rss.xml', 'General News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (4, 'ERTNews.gr', 'https://www.ertnews.gr/feed/', 'General News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (5, 'Tanea.gr', 'https://www.tanea.gr/feed/', 'General News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (6, 'DNews.gr', 'https://www.dnews.gr/feed', 'General News', 1);

    -- TaxHeaven Feeds
    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (7, 'TaxHeaven - New Content', 'https://www.taxheaven.gr/bibliothiki/soft/xml/soft_new.xml', 'Tax News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (8, 'TaxHeaven - Laws', 'https://www.taxheaven.gr/bibliothiki/soft/xml/soft_law.xml', 'Tax News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (9, 'TaxHeaven - Legal Content', 'https://www.taxheaven.gr/bibliothiki/soft/xml/soft_lawl.xml', 'Tax News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (10, 'TaxHeaven - Data/Info', 'https://www.taxheaven.gr/bibliothiki/soft/xml/soft_dat.xml', 'Tax News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (11, 'TaxHeaven - Articles', 'https://www.taxheaven.gr/bibliothiki/soft/xml/soft_art.xml', 'Tax News', 1);

    INSERT INTO RSSFeeds (FeedID, FeedName, FeedURL, Category, IsActive)
    VALUES (12, 'TaxHeaven - Forum', 'https://www.taxheaven.gr/bibliothiki/soft/xml/soft_forum.xml', 'Tax News', 1);

    SET IDENTITY_INSERT RSSFeeds OFF;
END
GO

-- =====================================================
-- Verification Queries (commented out for production)
-- =====================================================
-- SELECT * FROM RSSFeeds;
-- SELECT * FROM Articles ORDER BY PublishDate DESC;
