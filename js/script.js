/**
 * Greek Tax News Hub - RSS Parser
 * Client-side RSS feed parser with local storage support
 */

class RSSParser {
    constructor() {
        this.feeds = [];
        this.articles = [];
        this.currentPage = 1;
        this.articlesPerPage = 12;
        this.isLoading = false;
        
        // CORS proxy for RSS feeds
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
        
        // Load saved feeds from localStorage
        this.loadSavedFeeds();
        
        // Initialize the app
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.renderSavedFeeds();
        
        // Load articles from saved feeds
        if (this.feeds.length > 0) {
            this.loadAllFeeds();
        } else {
            this.showEmptyState();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const feedForm = document.getElementById('feed-form');
        if (feedForm) {
            feedForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddFeed();
            });
        }

        const clearAllBtn = document.getElementById('clear-all-feeds');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFeeds();
            });
        }

        // Event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            // Handle feed removal
            if (e.target.hasAttribute('data-remove-feed')) {
                const feedUrl = e.target.getAttribute('data-remove-feed');
                this.removeFeed(feedUrl);
            }
            
            // Handle pagination
            if (e.target.hasAttribute('data-page')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                this.goToPage(page);
            }
            
            // Handle retry button
            if (e.target.hasAttribute('data-retry')) {
                this.loadAllFeeds();
            }
        });
    }

    /**
     * Load saved feeds from localStorage
     */
    loadSavedFeeds() {
        try {
            const savedFeeds = localStorage.getItem('rssFeeds');
            if (savedFeeds) {
                this.feeds = JSON.parse(savedFeeds);
            } else {
                // Default feeds for Greek Tax News
                this.feeds = [
                    'https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss'
                ];
                this.saveFeedsToStorage();
            }
        } catch (error) {
            console.error('Error loading saved feeds:', error);
            this.feeds = [];
        }
    }

    /**
     * Save feeds to localStorage
     */
    saveFeedsToStorage() {
        try {
            localStorage.setItem('rssFeeds', JSON.stringify(this.feeds));
        } catch (error) {
            console.error('Error saving feeds:', error);
            this.showNotification('Failed to save feeds', 'error');
        }
    }

    /**
     * Handle adding a new feed
     */
    async handleAddFeed() {
        const input = document.getElementById('feed-url');
        const feedUrl = input.value.trim();

        if (!feedUrl) {
            this.showNotification('Please enter a feed URL', 'warning');
            return;
        }

        // Basic URL validation
        if (!this.isValidUrl(feedUrl)) {
            this.showNotification('Please enter a valid URL', 'error');
            return;
        }

        // Check if feed already exists
        if (this.feeds.includes(feedUrl)) {
            this.showNotification('This feed is already added', 'warning');
            return;
        }

        // Test if the feed is valid
        this.setLoading(true);
        try {
            await this.parseFeed(feedUrl);
            this.feeds.push(feedUrl);
            this.saveFeedsToStorage();
            this.renderSavedFeeds();
            await this.loadAllFeeds();
            input.value = '';
            this.showNotification('Feed added successfully!', 'success');
        } catch (error) {
            console.error('Error adding feed:', error);
            this.showNotification('Failed to add feed. Please check the URL.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Remove a feed
     */
    removeFeed(feedUrl) {
        this.feeds = this.feeds.filter(feed => feed !== feedUrl);
        this.saveFeedsToStorage();
        this.renderSavedFeeds();
        this.loadAllFeeds();
        this.showNotification('Feed removed', 'info');
    }

    /**
     * Clear all feeds
     */
    clearAllFeeds() {
        if (confirm('Are you sure you want to remove all feeds?')) {
            this.feeds = [];
            this.articles = [];
            this.saveFeedsToStorage();
            this.renderSavedFeeds();
            this.showEmptyState();
            this.showNotification('All feeds cleared', 'info');
        }
    }

    /**
     * Load all feeds
     */
    async loadAllFeeds() {
        this.setLoading(true);
        this.articles = [];

        try {
            const promises = this.feeds.map(feedUrl => this.parseFeed(feedUrl));
            const results = await Promise.allSettled(promises);

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    this.articles.push(...result.value);
                } else {
                    console.error(`Failed to load feed ${this.feeds[index]}:`, result.reason);
                }
            });

            // Sort articles by date (newest first)
            this.articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

            this.currentPage = 1;
            this.renderArticles();
        } catch (error) {
            console.error('Error loading feeds:', error);
            this.showError('Failed to load feeds');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Parse RSS feed using CORS proxy
     */
    async parseFeed(feedUrl) {
        try {
            // Check if it's a localhost URL to bypass CORS proxy
            let isLocalhost = false;
            try {
                const urlObj = new URL(feedUrl);
                isLocalhost = urlObj.hostname === 'localhost' || 
                             urlObj.hostname === '127.0.0.1' || 
                             urlObj.hostname === '[::1]';
            } catch (e) {
                // Invalid URL, let it fail in fetch
            }
            
            const fetchUrl = isLocalhost ? feedUrl : this.corsProxy + encodeURIComponent(feedUrl);
            
            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Check for XML parsing errors
            const parserError = xml.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid RSS feed format');
            }

            const items = xml.querySelectorAll('item');
            const articles = [];

            items.forEach(item => {
                const article = {
                    title: this.getTextContent(item, 'title'),
                    description: this.getTextContent(item, 'description'),
                    link: this.getTextContent(item, 'link'),
                    pubDate: this.getTextContent(item, 'pubDate'),
                    source: this.extractDomain(feedUrl)
                };

                // Only add if we have at least a title
                if (article.title) {
                    articles.push(article);
                }
            });

            return articles;
        } catch (error) {
            console.error('Error parsing feed:', feedUrl, error);
            throw error;
        }
    }

    /**
     * Get text content from XML element
     */
    getTextContent(item, tagName) {
        const element = item.querySelector(tagName);
        return element ? element.textContent.trim() : '';
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'Unknown';
        }
    }

    /**
     * Render saved feeds
     */
    renderSavedFeeds() {
        const feedsList = document.getElementById('feeds-list');
        const clearAllBtn = document.getElementById('clear-all-feeds');

        if (!feedsList) return;

        if (this.feeds.length === 0) {
            feedsList.innerHTML = '<p class="empty-state">No feeds saved yet. Add one above!</p>';
            if (clearAllBtn) clearAllBtn.disabled = true;
            return;
        }

        if (clearAllBtn) clearAllBtn.disabled = false;

        feedsList.innerHTML = this.feeds.map(feed => `
            <div class="feed-tag">
                <span>${this.extractDomain(feed)}</span>
                <button data-remove-feed="${this.escapeHtml(feed)}" 
                        title="Remove feed">×</button>
            </div>
        `).join('');
    }

    /**
     * Render articles
     */
    renderArticles() {
        const articlesSection = document.getElementById('articles-section');

        if (!articlesSection) return;

        if (this.articles.length === 0) {
            articlesSection.innerHTML = '<div class="empty-state"><p>No articles found</p></div>';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        const paginatedArticles = this.articles.slice(startIndex, endIndex);

        const articlesHtml = paginatedArticles.map(article => `
            <article class="article-card">
                <h2 class="article-title">
                    <a href="${this.escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer">
                        ${this.escapeHtml(article.title)}
                    </a>
                </h2>
                <p class="article-description">
                    ${this.escapeHtml(this.truncateText(article.description, 150))}
                </p>
                <div class="article-meta">
                    <span class="article-date">
                        📅 ${this.formatDate(article.pubDate)}
                    </span>
                    <span class="article-source">${this.escapeHtml(article.source)}</span>
                </div>
            </article>
        `).join('');

        articlesSection.innerHTML = `
            <div class="articles-grid">
                ${articlesHtml}
            </div>
            ${this.renderPagination()}
        `;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const totalPages = Math.ceil(this.articles.length / this.articlesPerPage);

        if (totalPages <= 1) return '';

        let paginationHtml = '<div class="pagination">';

        // Previous button
        paginationHtml += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    data-page="${this.currentPage - 1}">
                ← Previous
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                paginationHtml += `
                    <button class="${i === this.currentPage ? 'active' : ''}"
                            data-page="${i}"
                            ${i === this.currentPage ? 'disabled' : ''}>
                        ${i}
                    </button>
                `;
            } else if (
                i === this.currentPage - 2 ||
                i === this.currentPage + 2
            ) {
                paginationHtml += '<span class="ellipsis">...</span>';
            }
        }

        // Next button
        paginationHtml += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} 
                    data-page="${this.currentPage + 1}">
                Next →
            </button>
        `;

        paginationHtml += '</div>';
        return paginationHtml;
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const articlesSection = document.getElementById('articles-section');
        if (articlesSection) {
            articlesSection.innerHTML = `
                <div class="empty-state">
                    <h3>Welcome to Greek Tax News Hub!</h3>
                    <p>Add RSS feed URLs above to start reading news articles.</p>
                    <p class="mt-2">Try adding: https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss</p>
                </div>
            `;
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        const articlesSection = document.getElementById('articles-section');
        if (articlesSection) {
            articlesSection.innerHTML = `
                <div class="error-state">
                    <h3>Error</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <button class="btn btn-primary mt-2" data-retry="true">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const addBtn = document.querySelector('#feed-form button[type="submit"]');
        const articlesSection = document.getElementById('articles-section');

        if (addBtn) {
            addBtn.disabled = loading;
            addBtn.textContent = loading ? 'Loading...' : 'Add Feed';
        }

        if (loading && articlesSection) {
            articlesSection.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading articles...</p>
                </div>
            `;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Unknown date';
            }

            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            return 'Unknown date';
        }
    }

    /**
     * Truncate text
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        // Strip HTML tags
        const stripped = text.replace(/<[^>]*>/g, '');
        if (stripped.length <= maxLength) return stripped;
        return stripped.substring(0, maxLength) + '...';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Validate URL
     */
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }
}

// Initialize the RSS parser when DOM is ready
let rssParser;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        rssParser = new RSSParser();
    });
} else {
    rssParser = new RSSParser();
}
