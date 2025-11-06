// Local Storage Manager for Greek Tax News Hub
class GreekTaxStorageManager {
    constructor() {
        this.KEYS = {
            ARTICLES: 'greekTaxNews_articles',
            BOOKMARKS: 'greekTaxNews_bookmarks',
            ARCHIVED: 'greekTaxNews_archived',
            SETTINGS: 'greekTaxNews_settings',
            FEEDS: 'greekTaxNews_feeds',
            THEME: 'greekTaxNews_theme',
            LAST_REFRESH: 'greekTaxNews_lastRefresh'
        };
    }

    // Article Management
    saveArticles(articles) {
        try {
            localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
            return true;
        } catch (error) {
            console.error('Error saving articles:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    loadArticles() {
        try {
            const data = localStorage.getItem(this.KEYS.ARTICLES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
        }
    }

    addArticle(article) {
        const articles = this.loadArticles();
        
        // Check for duplicates
        const exists = articles.some(a => a.id === article.id);
        if (exists) {
            return false;
        }

        articles.unshift(article);
        
        // Keep only latest 1000 articles
        if (articles.length > 1000) {
            articles.splice(1000);
        }

        return this.saveArticles(articles);
    }

    updateArticle(articleId, updates) {
        const articles = this.loadArticles();
        const index = articles.findIndex(a => a.id === articleId);

        if (index !== -1) {
            articles[index] = { ...articles[index], ...updates };
            return this.saveArticles(articles);
        }

        return false;
    }

    deleteArticle(articleId) {
        const articles = this.loadArticles();
        const filtered = articles.filter(a => a.id !== articleId);
        return this.saveArticles(filtered);
    }

    markAsRead(articleId) {
        return this.updateArticle(articleId, { read: true });
    }

    markAsUnread(articleId) {
        return this.updateArticle(articleId, { read: false });
    }

    // Bookmark Management
    toggleBookmark(articleId) {
        const articles = this.loadArticles();
        const article = articles.find(a => a.id === articleId);

        if (article) {
            article.bookmarked = !article.bookmarked;
            this.saveArticles(articles);

            // Also save to bookmarks collection
            if (article.bookmarked) {
                this.addToBookmarks(article);
            } else {
                this.removeFromBookmarks(articleId);
            }

            return article.bookmarked;
        }

        return false;
    }

    addToBookmarks(article) {
        try {
            const bookmarks = this.loadBookmarks();
            const exists = bookmarks.some(b => b.id === article.id);
            
            if (!exists) {
                bookmarks.unshift(article);
                localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(bookmarks));
            }
            
            return true;
        } catch (error) {
            console.error('Error adding bookmark:', error);
            return false;
        }
    }

    removeFromBookmarks(articleId) {
        try {
            const bookmarks = this.loadBookmarks();
            const filtered = bookmarks.filter(b => b.id !== articleId);
            localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error removing bookmark:', error);
            return false;
        }
    }

    loadBookmarks() {
        try {
            const data = localStorage.getItem(this.KEYS.BOOKMARKS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            return [];
        }
    }

    // Archive Management
    toggleArchive(articleId) {
        const articles = this.loadArticles();
        const article = articles.find(a => a.id === articleId);

        if (article) {
            article.archived = !article.archived;
            this.saveArticles(articles);

            if (article.archived) {
                this.addToArchive(article);
            } else {
                this.removeFromArchive(articleId);
            }

            return article.archived;
        }

        return false;
    }

    addToArchive(article) {
        try {
            const archived = this.loadArchived();
            const exists = archived.some(a => a.id === article.id);
            
            if (!exists) {
                archived.unshift(article);
                localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(archived));
            }
            
            return true;
        } catch (error) {
            console.error('Error adding to archive:', error);
            return false;
        }
    }

    removeFromArchive(articleId) {
        try {
            const archived = this.loadArchived();
            const filtered = archived.filter(a => a.id !== articleId);
            localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error removing from archive:', error);
            return false;
        }
    }

    loadArchived() {
        try {
            const data = localStorage.getItem(this.KEYS.ARCHIVED);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading archived:', error);
            return [];
        }
    }

    // Settings Management
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            autoRefresh: true,
            refreshInterval: 1800000,
            theme: 'light',
            language: 'el',
            notificationsEnabled: true,
            articlesPerPage: 20,
            defaultCategory: 'all'
        };
    }

    // Theme Management
    saveTheme(theme) {
        try {
            localStorage.setItem(this.KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    }

    loadTheme() {
        try {
            return localStorage.getItem(this.KEYS.THEME) || 'light';
        } catch (error) {
            console.error('Error loading theme:', error);
            return 'light';
        }
    }

    // Feed Management
    saveFeeds(feeds) {
        try {
            localStorage.setItem(this.KEYS.FEEDS, JSON.stringify(feeds));
            return true;
        } catch (error) {
            console.error('Error saving feeds:', error);
            return false;
        }
    }

    loadFeeds() {
        try {
            const data = localStorage.getItem(this.KEYS.FEEDS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading feeds:', error);
            return null;
        }
    }

    // Last Refresh Tracking
    saveLastRefresh(timestamp) {
        try {
            localStorage.setItem(this.KEYS.LAST_REFRESH, timestamp.toString());
            return true;
        } catch (error) {
            console.error('Error saving last refresh:', error);
            return false;
        }
    }

    loadLastRefresh() {
        try {
            const data = localStorage.getItem(this.KEYS.LAST_REFRESH);
            return data ? parseInt(data) : 0;
        } catch (error) {
            console.error('Error loading last refresh:', error);
            return 0;
        }
    }

    // Export/Import
    exportData() {
        try {
            const data = {
                articles: this.loadArticles(),
                bookmarks: this.loadBookmarks(),
                archived: this.loadArchived(),
                settings: this.loadSettings(),
                feeds: this.loadFeeds(),
                theme: this.loadTheme(),
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.articles) this.saveArticles(data.articles);
            if (data.bookmarks) localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(data.bookmarks));
            if (data.archived) localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(data.archived));
            if (data.settings) this.saveSettings(data.settings);
            if (data.feeds) this.saveFeeds(data.feeds);
            if (data.theme) this.saveTheme(data.theme);

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Storage Statistics
    getStorageStats() {
        try {
            const articles = this.loadArticles();
            const bookmarks = this.loadBookmarks();
            const archived = this.loadArchived();

            let totalSize = 0;
            for (let key in localStorage) {
                if (key.startsWith('greekTaxNews_')) {
                    totalSize += localStorage[key].length * 2; // UTF-16 uses 2 bytes per char
                }
            }

            return {
                articleCount: articles.length,
                bookmarkCount: bookmarks.length,
                archivedCount: archived.length,
                totalSize: totalSize,
                totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
                totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    // Clear specific data
    clearArticles() {
        localStorage.removeItem(this.KEYS.ARTICLES);
    }

    clearBookmarks() {
        localStorage.removeItem(this.KEYS.BOOKMARKS);
    }

    clearArchived() {
        localStorage.removeItem(this.KEYS.ARCHIVED);
    }

    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Error handling
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded. Clearing old articles...');
            const articles = this.loadArticles();
            if (articles.length > 500) {
                const trimmed = articles.slice(0, 500);
                this.saveArticles(trimmed);
            }
        }
    }

    // Check if storage is available
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.storageManager = new GreekTaxStorageManager();
}
