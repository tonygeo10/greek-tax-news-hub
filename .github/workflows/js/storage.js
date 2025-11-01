/ Local Storage Management for Greek Tax News Hub
class StorageManager {
    constructor() {
        this.ARTICLES_KEY = 'greek-tax-news-articles';
        this.FEEDS_KEY = 'greek-tax-news-feeds';
        this.SETTINGS_KEY = 'greek-tax-news-settings';
    }
    
    // Article management
    saveArticles(articles) {
        try {
            localStorage.setItem(this.ARTICLES_KEY, JSON.stringify(articles));
            return true;
        } catch (error) {
            console.error('Error saving articles:', error);
            return false;
        }
    }
    
    loadArticles() {
        try {
            const stored = localStorage.getItem(this.ARTICLES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
        }
    }
    
    addArticle(article) {
        const articles = this.loadArticles();
        
        // Check for duplicates
        const isDuplicate = articles.some(existing => 
            existing.title === article.title && existing.source === article.source
        );
        
        if (!isDuplicate) {
            // Add unique backend ID for compatibility
            article.__backendId = this.generateId();
            articles.unshift(article); // Add to beginning
            
            // Limit to 999 articles
            if (articles.length > 999) {
                articles.splice(999);
            }
            
            this.saveArticles(articles);
            return true;
        }
        
        return false;
    }
    
    updateArticle(updatedArticle) {
        const articles = this.loadArticles();
        const index = articles.findIndex(a => a.__backendId === updatedArticle.__backendId);
        
        if (index !== -1) {
            articles[index] = updatedArticle;
            this.saveArticles(articles);
            return true;
        }
        
        return false;
    }
    
    deleteArticle(articleId) {
        const articles = this.loadArticles();
        const filtered = articles.filter(a => a.__backendId !== articleId);
        
        if (filtered.length !== articles.length) {
            this.saveArticles(filtered);
            return true;
        }
        
        return false;
    }
    
    // Feed management
    saveFeeds(feeds) {
        try {
            localStorage.setItem(this.FEEDS_KEY, JSON.stringify(feeds));
            return true;
        } catch (error) {
            console.error('Error saving feeds:', error);
            return false;
        }
    }
    
    loadFeeds() {
        try {
            const stored = localStorage.getItem(this.FEEDS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading feeds:', error);
            return [];
        }
    }
    
    // Settings management
    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }
    
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.SETTINGS_KEY);
            return stored ? JSON.parse(stored) : {
                autoRefresh: false,
                refreshInterval: 1800000, // 30 minutes
                theme: 'light',
                language: 'el'
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }
    
    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    clearAllData() {
        try {
            localStorage.removeItem(this.ARTICLES_KEY);
            localStorage.removeItem(this.FEEDS_KEY);
            localStorage.removeItem(this.SETTINGS_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
    
    getStorageInfo() {
        try {
            const articles = this.loadArticles();
            const feeds = this.loadFeeds();
            
            return {
                articleCount: articles.length,
                feedCount: feeds.length,
                storageUsed: this.calculateStorageUsage(),
                lastUpdate: articles.length > 0 ? articles[0].created_at : null
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
    
    calculateStorageUsage() {
        let total = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('greek-tax-news-')) {
                total += localStorage[key].length;
            }
        }
        
        return {
            bytes: total,
            kb: Math.round(total / 1024 * 100) / 100,
            mb: Math.round(total / (1024 * 1024) * 100) / 100
        };
    }
    
    // Export/Import functionality
    exportData() {
        try {
            const data = {
                articles: this.loadArticles(),
                feeds: this.loadFeeds(),
                settings: this.loadSettings(),
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
            
            if (data.articles) {
                this.saveArticles(data.articles);
            }
            
            if (data.feeds) {
                this.saveFeeds(data.feeds);
            }
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global storage manager instance
window.storageManager = new StorageManager();
