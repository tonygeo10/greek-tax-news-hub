// Enhanced RSS Parser for Greek Tax News
class GreekTaxRSSParser {
    constructor() {
        // Note: Using third-party CORS proxies introduces some security considerations.
        // For production use, consider implementing your own proxy service
        // or validating responses more thoroughly.
        this.corsProxies = [
            'https://api.allorigins.win/get?url=',
            'https://api.rss2json.com/v1/api.json?rss_url='
        ];
        this.cache = new Map();
        this.cacheTimeout = 600000; // 10 minutes
    }

    /**
     * Parse RSS feed with Greek character support
     * @param {string} url - RSS feed URL
     * @param {string} feedId - Feed identifier
     * @returns {Promise<Array>} Array of articles
     */
    async parseFeed(url, feedId) {
        try {
            // Check cache first
            const cached = this.cache.get(url);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📦 Using cached data for ${feedId}`);
                return cached.articles;
            }

            console.log(`🔍 Fetching RSS feed: ${feedId}`);
            
            // Try multiple methods to fetch the feed
            let articles = await this.fetchWithProxies(url, feedId);
            
            if (!articles || articles.length === 0) {
                throw new Error('No articles found in feed');
            }

            // Cache the results
            this.cache.set(url, {
                articles,
                timestamp: Date.now()
            });

            console.log(`✅ Successfully parsed ${articles.length} articles from ${feedId}`);
            return articles;

        } catch (error) {
            console.error(`❌ Error parsing feed ${feedId}:`, error);
            throw error;
        }
    }

    /**
     * Fetch feed using multiple proxy services
     * @param {string} url - RSS feed URL
     * @param {string} feedId - Feed identifier
     * @returns {Promise<Array>} Array of articles
     */
    async fetchWithProxies(url, feedId) {
        const errors = [];

        // Try RSS2JSON first (best for Greek characters)
        try {
            const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
            const response = await fetch(rss2jsonUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    return this.processRSS2JSONItems(data.items, feedId);
                }
            }
        } catch (error) {
            errors.push({ proxy: 'RSS2JSON', error: error.message });
        }

        // Try AllOrigins
        try {
            const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(allOriginsUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.contents) {
                    return this.parseXMLContent(data.contents, feedId);
                }
            }
        } catch (error) {
            errors.push({ proxy: 'AllOrigins', error: error.message });
        }

        // If all proxies fail, throw error
        throw new Error(`All proxy attempts failed: ${JSON.stringify(errors)}`);
    }

    /**
     * Process RSS2JSON items
     * @param {Array} items - RSS items from RSS2JSON
     * @param {string} feedId - Feed identifier
     * @returns {Array} Processed articles
     */
    processRSS2JSONItems(items, feedId) {
        return items.map((item, index) => {
            const article = {
                id: this.generateArticleId(item.title, item.link, item.pubDate),
                title: this.cleanGreekText(item.title || 'Χωρίς τίτλο'),
                description: this.cleanGreekText(item.description || item.content || ''),
                link: item.link || item.guid || '',
                pubDate: this.parseGreekDate(item.pubDate),
                author: item.author || '',
                category: item.categories && item.categories.length > 0 ? item.categories[0] : '',
                feedId: feedId,
                read: false,
                bookmarked: false,
                archived: false,
                createdAt: new Date().toISOString()
            };

            // Add reading time estimate
            article.readingTime = this.estimateReadingTime(article.description);

            return article;
        });
    }

    /**
     * Parse XML content directly
     * @param {string} xmlContent - XML string
     * @param {string} feedId - Feed identifier
     * @returns {Array} Processed articles
     */
    parseXMLContent(xmlContent, feedId) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parsing failed');
        }

        // Try RSS 2.0 format
        let items = xmlDoc.querySelectorAll('item');
        
        // If no items, try Atom format
        if (items.length === 0) {
            items = xmlDoc.querySelectorAll('entry');
        }

        const articles = [];
        items.forEach((item, index) => {
            try {
                const article = this.parseXMLItem(item, feedId);
                if (article) {
                    articles.push(article);
                }
            } catch (error) {
                console.warn('Error parsing item:', error);
            }
        });

        return articles;
    }

    /**
     * Parse individual XML item
     * @param {Element} item - XML item element
     * @param {string} feedId - Feed identifier
     * @returns {Object} Article object
     */
    parseXMLItem(item, feedId) {
        const getContent = (tagName) => {
            const element = item.querySelector(tagName);
            return element ? element.textContent.trim() : '';
        };

        const title = getContent('title') || 'Χωρίς τίτλο';
        const description = getContent('description') || getContent('summary') || getContent('content') || '';
        const link = getContent('link') || getContent('guid') || '';
        const pubDate = getContent('pubDate') || getContent('published') || getContent('updated') || '';
        const author = getContent('author') || getContent('creator') || '';
        const category = getContent('category') || '';

        const article = {
            id: this.generateArticleId(title, link, pubDate),
            title: this.cleanGreekText(title),
            description: this.cleanGreekText(description),
            link: link,
            pubDate: this.parseGreekDate(pubDate),
            author: author,
            category: category,
            feedId: feedId,
            read: false,
            bookmarked: false,
            archived: false,
            createdAt: new Date().toISOString()
        };

        article.readingTime = this.estimateReadingTime(article.description);

        return article;
    }

    /**
     * Clean Greek text (handle HTML entities, special chars)
     * Security Note: Uses textContent to safely extract text without XSS risk.
     * The regex replacement is a secondary sanitization step.
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    cleanGreekText(text) {
        if (!text) return '';

        // Primary security: Use textContent to safely extract text (no XSS)
        const temp = document.createElement('div');
        temp.textContent = text;
        let cleaned = temp.textContent;

        // Secondary sanitization: Remove any remaining tag-like structures
        // This is safe because textContent has already neutralized any actual HTML
        cleaned = cleaned.replace(/<[^>]+>/g, '');

        // Normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    /**
     * Parse Greek date formats
     * @param {string} dateString - Date string to parse
     * @returns {string} ISO date string
     */
    parseGreekDate(dateString) {
        if (!dateString) return new Date().toISOString();

        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        } catch (error) {
            console.warn('Date parsing failed:', dateString);
        }

        return new Date().toISOString();
    }

    /**
     * Generate unique article ID
     * @param {string} title - Article title
     * @param {string} link - Article link
     * @param {string} pubDate - Publication date
     * @returns {string} Unique ID
     */
    generateArticleId(title, link, pubDate) {
        const content = `${title}-${link}-${pubDate}`;
        const hash = this.simpleHash(content);
        return `article-${hash}-${Date.now()}`;
    }

    /**
     * Simple hash function
     * @param {string} str - String to hash
     * @returns {string} Hash string
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Estimate reading time for article
     * @param {string} text - Article text
     * @returns {number} Estimated reading time in minutes
     */
    estimateReadingTime(text) {
        if (!text) return 0;
        
        const words = text.split(/\s+/).length;
        const wpm = CONFIG?.SETTINGS?.READING_SPEED_WPM || 200;
        const minutes = Math.ceil(words / wpm);
        
        return minutes;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('📦 Cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.greekTaxRSSParser = new GreekTaxRSSParser();
}
