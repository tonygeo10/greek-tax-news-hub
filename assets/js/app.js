// Main Application for Greek Tax News Hub
class GreekTaxNewsHub {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.articlesPerPage = 20;
        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.selectedFeed = 'all';
        this.sortBy = 'date-desc';
        this.theme = 'light';
        this.autoRefreshTimer = null;
        this.isLoading = false;

        // Initialize components
        this.storage = window.storageManager;
        this.parser = window.greekTaxRSSParser;
        this.feeds = CONFIG.DEFAULT_FEEDS;

        // Initialize app
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Greek Tax News Hub...');

            // Load theme
            this.loadTheme();

            // Load settings
            const settings = this.storage.loadSettings();
            this.articlesPerPage = settings.articlesPerPage || 20;

            // Setup event listeners
            this.setupEventListeners();

            // Render UI
            this.renderUI();

            // Load cached articles first
            this.loadCachedArticles();

            // Fetch fresh articles
            await this.refreshAllFeeds();

            // Setup auto-refresh
            if (settings.autoRefresh) {
                this.setupAutoRefresh(settings.refreshInterval);
            }

            console.log('✅ Initialization complete');

        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showNotification('Σφάλμα αρχικοποίησης', 'error');
        }
    }

    setupEventListeners() {
        // Search
        document.addEventListener('input', (e) => {
            if (e.target.id === 'searchInput') {
                this.handleSearch(e.target.value);
            }
        });

        // Category filter
        document.addEventListener('change', (e) => {
            if (e.target.id === 'categoryFilter') {
                this.handleCategoryChange(e.target.value);
            }
        });

        // Feed filter
        document.addEventListener('change', (e) => {
            if (e.target.id === 'feedFilter') {
                this.handleFeedChange(e.target.value);
            }
        });

        // Sort
        document.addEventListener('change', (e) => {
            if (e.target.id === 'sortSelect') {
                this.handleSortChange(e.target.value);
            }
        });

        // Theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.id === 'themeToggle') {
                this.toggleTheme();
            }
        });

        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshBtn') {
                this.refreshAllFeeds();
            }
        });

        // Export buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportPdf') {
                this.exportToPDF();
            } else if (e.target.id === 'exportTxt') {
                this.exportToText();
            } else if (e.target.id === 'exportJson') {
                this.exportToJSON();
            }
        });

        // Article actions
        document.addEventListener('click', (e) => {
            const articleId = e.target.dataset.articleId;
            
            if (e.target.classList.contains('bookmark-btn')) {
                this.toggleBookmark(articleId);
            } else if (e.target.classList.contains('archive-btn')) {
                this.toggleArchive(articleId);
            } else if (e.target.classList.contains('read-btn')) {
                this.markAsRead(articleId);
            }
        });
    }

    loadTheme() {
        this.theme = this.storage.loadTheme();
        this.applyTheme(this.theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        this.storage.saveTheme(theme);
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.showNotification(
            `Θέμα: ${newTheme === 'light' ? 'Φωτεινό' : 'Σκούρο'}`, 
            'info'
        );
    }

    loadCachedArticles() {
        const cached = this.storage.loadArticles();
        if (cached && cached.length > 0) {
            this.articles = cached;
            this.applyFilters();
            console.log(`📦 Loaded ${cached.length} cached articles`);
        }
    }

    async refreshAllFeeds() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.showLoadingState();

            const newArticles = [];
            const enabledFeeds = this.feeds.filter(f => f.enabled);

            for (const feed of enabledFeeds) {
                try {
                    const articles = await this.parser.parseFeed(feed.url, feed.id);
                    
                    // Add feed metadata to each article
                    articles.forEach(article => {
                        article.feedId = feed.id;
                        article.feedName = feed.name;
                        article.feedCategory = feed.category;
                        article.priority = feed.priority;
                        article.feedColor = feed.color;
                    });

                    newArticles.push(...articles);

                } catch (error) {
                    console.error(`Error fetching ${feed.name}:`, error);
                    this.showNotification(`Σφάλμα: ${feed.name}`, 'warning');
                }
            }

            // Merge with existing articles (avoid duplicates)
            this.mergeArticles(newArticles);

            // Save to storage
            this.storage.saveArticles(this.articles);
            this.storage.saveLastRefresh(Date.now());

            // Apply filters and render
            this.applyFilters();

            // Show success notification
            const newCount = newArticles.length;
            this.showNotification(
                `Φορτώθηκαν ${newCount} νέα άρθρα`, 
                'success'
            );

        } catch (error) {
            console.error('Error refreshing feeds:', error);
            this.showNotification('Σφάλμα ανανέωσης', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    mergeArticles(newArticles) {
        const existingIds = new Set(this.articles.map(a => a.id));
        
        // Add only new articles
        const uniqueNew = newArticles.filter(a => !existingIds.has(a.id));
        
        this.articles = [...uniqueNew, ...this.articles];
        
        // Keep only latest 1000 articles
        if (this.articles.length > 1000) {
            this.articles = this.articles.slice(0, 1000);
        }
    }

    applyFilters() {
        let filtered = [...this.articles];

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(query) ||
                article.description.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (this.selectedCategory && this.selectedCategory !== 'all') {
            filtered = filtered.filter(article =>
                article.feedCategory === this.selectedCategory
            );
        }

        // Apply feed filter
        if (this.selectedFeed && this.selectedFeed !== 'all') {
            filtered = filtered.filter(article =>
                article.feedId === this.selectedFeed
            );
        }

        // Apply sorting
        filtered = this.sortArticles(filtered);

        this.filteredArticles = filtered;
        this.currentPage = 1;
        this.renderArticles();
    }

    sortArticles(articles) {
        switch (this.sortBy) {
            case 'date-desc':
                return articles.sort((a, b) => 
                    new Date(b.pubDate) - new Date(a.pubDate)
                );
            case 'date-asc':
                return articles.sort((a, b) => 
                    new Date(a.pubDate) - new Date(b.pubDate)
                );
            case 'title-asc':
                return articles.sort((a, b) => 
                    a.title.localeCompare(b.title, 'el')
                );
            case 'title-desc':
                return articles.sort((a, b) => 
                    b.title.localeCompare(a.title, 'el')
                );
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return articles.sort((a, b) => {
                    const aPriority = priorityOrder[a.priority] || 3;
                    const bPriority = priorityOrder[b.priority] || 3;
                    if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                    }
                    return new Date(b.pubDate) - new Date(a.pubDate);
                });
            default:
                return articles;
        }
    }

    handleSearch(query) {
        this.searchQuery = query;
        this.applyFilters();
    }

    handleCategoryChange(category) {
        this.selectedCategory = category;
        this.applyFilters();
    }

    handleFeedChange(feedId) {
        this.selectedFeed = feedId;
        this.applyFilters();
    }

    handleSortChange(sortBy) {
        this.sortBy = sortBy;
        this.applyFilters();
    }

    toggleBookmark(articleId) {
        const bookmarked = this.storage.toggleBookmark(articleId);
        
        // Update local article
        const article = this.articles.find(a => a.id === articleId);
        if (article) {
            article.bookmarked = bookmarked;
        }

        this.renderArticles();
        this.showNotification(
            bookmarked ? 'Προστέθηκε στους σελιδοδείκτες' : 'Αφαιρέθηκε από τους σελιδοδείκτες',
            'info'
        );
    }

    toggleArchive(articleId) {
        const archived = this.storage.toggleArchive(articleId);
        
        // Update local article
        const article = this.articles.find(a => a.id === articleId);
        if (article) {
            article.archived = archived;
        }

        this.renderArticles();
        this.showNotification(
            archived ? 'Αρχειοθετήθηκε' : 'Αφαιρέθηκε από το αρχείο',
            'info'
        );
    }

    markAsRead(articleId) {
        this.storage.markAsRead(articleId);
        
        // Update local article
        const article = this.articles.find(a => a.id === articleId);
        if (article) {
            article.read = true;
        }

        this.renderArticles();
    }

    renderUI() {
        // This will be called to render the main UI structure
        // The actual HTML structure is in index.html
        this.renderArticles();
    }

    renderArticles() {
        const container = document.getElementById('articlesContainer');
        if (!container) return;

        if (this.filteredArticles.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        // Pagination
        const start = (this.currentPage - 1) * this.articlesPerPage;
        const end = start + this.articlesPerPage;
        const paginatedArticles = this.filteredArticles.slice(start, end);

        // Render articles
        container.innerHTML = paginatedArticles.map(article => 
            this.renderArticleCard(article)
        ).join('');

        // Render pagination
        this.renderPagination();

        // Update stats
        this.updateStats();
    }

    renderArticleCard(article) {
        const date = new Date(article.pubDate);
        const formattedDate = date.toLocaleDateString('el-GR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('el-GR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const priorityBadge = article.priority === 'high' 
            ? '<span class="priority-badge">Σημαντικό</span>' 
            : '';

        return `
            <article class="article-card ${article.read ? 'read' : ''}" data-id="${article.id}">
                <div class="article-header">
                    <div class="article-source" style="border-left: 3px solid ${article.feedColor}">
                        <span class="source-name">${this.escapeHtml(article.feedName)}</span>
                        ${priorityBadge}
                    </div>
                    <div class="article-actions">
                        <button class="action-btn bookmark-btn ${article.bookmarked ? 'active' : ''}" 
                                data-article-id="${article.id}" 
                                title="Σελιδοδείκτης">
                            ${article.bookmarked ? '★' : '☆'}
                        </button>
                        <button class="action-btn archive-btn ${article.archived ? 'active' : ''}" 
                                data-article-id="${article.id}" 
                                title="Αρχειοθέτηση">
                            📁
                        </button>
                    </div>
                </div>
                
                <h2 class="article-title">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer">
                        ${this.escapeHtml(article.title)}
                    </a>
                </h2>
                
                <p class="article-description">${this.escapeHtml(article.description)}</p>
                
                <div class="article-footer">
                    <span class="article-date">📅 ${formattedDate} • ${formattedTime}</span>
                    ${article.readingTime > 0 ? `<span class="reading-time">⏱️ ${article.readingTime} λεπτά</span>` : ''}
                </div>
            </article>
        `;
    }

    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredArticles.length / this.articlesPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button onclick="app.goToPage(${this.currentPage - 1})">← Προηγούμενη</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button class="${i === this.currentPage ? 'active' : ''}" 
                                onclick="app.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            html += `<button onclick="app.goToPage(${this.currentPage + 1})">Επόμενη →</button>`;
        }

        html += '</div>';
        paginationContainer.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateStats() {
        const statsContainer = document.getElementById('stats');
        if (!statsContainer) return;

        const stats = {
            total: this.articles.length,
            filtered: this.filteredArticles.length,
            bookmarked: this.articles.filter(a => a.bookmarked).length,
            unread: this.articles.filter(a => !a.read).length
        };

        statsContainer.innerHTML = `
            <span>Σύνολο: ${stats.total}</span>
            <span>Εμφανίζονται: ${stats.filtered}</span>
            <span>Σελιδοδείκτες: ${stats.bookmarked}</span>
            <span>Μη αναγνωσμένα: ${stats.unread}</span>
        `;
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>Δεν βρέθηκαν άρθρα</h3>
                <p>Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης ή ανανεώστε τα feeds.</p>
                <button onclick="app.refreshAllFeeds()" class="btn-primary">Ανανέωση Feeds</button>
            </div>
        `;
    }

    showLoadingState() {
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Φόρτωση άρθρων...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is cleared by renderArticles
    }

    setupAutoRefresh(interval) {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }

        this.autoRefreshTimer = setInterval(() => {
            console.log('🔄 Auto-refreshing feeds...');
            this.refreshAllFeeds();
        }, interval);
    }

    // Export functions
    exportToJSON() {
        const data = this.storage.exportData();
        if (data) {
            this.downloadFile(data, 'greek-tax-news-export.json', 'application/json');
            this.showNotification('Εξαγωγή JSON ολοκληρώθηκε', 'success');
        }
    }

    exportToText() {
        let text = 'GREEK TAX NEWS HUB - EXPORT\n';
        text += '=' .repeat(50) + '\n\n';

        this.filteredArticles.forEach((article, index) => {
            text += `${index + 1}. ${article.title}\n`;
            text += `   Πηγή: ${article.feedName}\n`;
            text += `   Ημερομηνία: ${new Date(article.pubDate).toLocaleString('el-GR')}\n`;
            text += `   Link: ${article.link}\n`;
            text += `   Περιγραφή: ${article.description}\n\n`;
            text += '-'.repeat(50) + '\n\n';
        });

        this.downloadFile(text, 'greek-tax-news-export.txt', 'text/plain');
        this.showNotification('Εξαγωγή Text ολοκληρώθηκε', 'success');
    }

    exportToPDF() {
        // Simple PDF export using print dialog
        window.print();
        this.showNotification('Χρησιμοποιήστε το διάλογο εκτύπωσης για αποθήκευση PDF', 'info');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) {
            console.log(`Notification (${type}): ${message}`);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GreekTaxNewsHub();
});
