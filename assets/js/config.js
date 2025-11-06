// Greek Tax News Hub Configuration
const CONFIG = {
    // Default RSS Feeds for Greek Tax News
    DEFAULT_FEEDS: [
        {
            id: 'aade',
            name: 'AADE - Ανεξάρτητη Αρχή Δημοσίων Εσόδων',
            url: 'https://www.aade.gr/deltia-typou-anakoinoseis?format=rss',
            category: 'government',
            priority: 'high',
            color: '#0066cc',
            enabled: true,
            description: 'Επίσημες ανακοινώσεις και δελτία τύπου από την AADE'
        },
        {
            id: 'taxheaven',
            name: 'Tax Heaven Greece',
            url: 'https://www.taxheaven.gr/rss',
            category: 'news',
            priority: 'high',
            color: '#009688',
            enabled: true,
            description: 'Φορολογικά νέα και αναλύσεις'
        },
        {
            id: 'forin',
            name: 'Forin.gr',
            url: 'https://www.forin.gr/feed',
            category: 'business',
            priority: 'medium',
            color: '#ff9800',
            enabled: true,
            description: 'Επιχειρηματικά και φορολογικά νέα'
        },
        {
            id: 'ekathimerini',
            name: 'eKathimerini - Φορολογία',
            url: 'https://feeds.feedburner.com/ekathim',
            category: 'news',
            priority: 'medium',
            color: '#e91e63',
            enabled: true,
            description: 'Φορολογικά νέα από την Καθημερινή'
        },
        {
            id: 'greekreporter',
            name: 'Greek Reporter',
            url: 'https://greekreporter.com/greece/feed',
            category: 'news',
            priority: 'low',
            color: '#673ab7',
            enabled: true,
            description: 'Ελληνικά νέα στα Αγγλικά'
        }
    ],

    // Category definitions
    CATEGORIES: {
        government: {
            label: 'Κυβερνητικές Ανακοινώσεις',
            icon: '🏛️',
            color: '#0066cc'
        },
        news: {
            label: 'Φορολογικά Νέα',
            icon: '📰',
            color: '#009688'
        },
        business: {
            label: 'Επιχειρηματικά',
            icon: '💼',
            color: '#ff9800'
        },
        law: {
            label: 'Νομοθεσία',
            icon: '⚖️',
            color: '#f44336'
        }
    },

    // Application settings
    SETTINGS: {
        AUTO_REFRESH: true,
        REFRESH_INTERVAL: 1800000, // 30 minutes in milliseconds
        MAX_ARTICLES_PER_FEED: 50,
        ARTICLES_PER_PAGE: 20,
        DEFAULT_THEME: 'light',
        DEFAULT_LANGUAGE: 'el',
        ENABLE_NOTIFICATIONS: true,
        OFFLINE_CACHE_DURATION: 86400000, // 24 hours
        READING_SPEED_WPM: 200 // Words per minute for reading time estimate
    },

    // UI Theme colors (Greek tax authority inspired)
    THEME: {
        light: {
            primary: '#0066cc',
            secondary: '#009688',
            background: '#f5f7fa',
            surface: '#ffffff',
            text: '#2c3e50',
            textSecondary: '#6c757d',
            border: '#e1e8ed',
            accent: '#ff9800',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196f3'
        },
        dark: {
            primary: '#4a90e2',
            secondary: '#26a69a',
            background: '#1a1a1a',
            surface: '#2d2d2d',
            text: '#e0e0e0',
            textSecondary: '#b0b0b0',
            border: '#404040',
            accent: '#ffb74d',
            success: '#66bb6a',
            warning: '#ffa726',
            error: '#ef5350',
            info: '#42a5f5'
        }
    },

    // Greek date/time formatting
    LOCALE: {
        language: 'el-GR',
        dateFormat: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },
        timeFormat: {
            hour: '2-digit',
            minute: '2-digit'
        }
    },

    // Export settings
    EXPORT: {
        formats: ['pdf', 'txt', 'json'],
        pdfOptions: {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        }
    },

    // API endpoints (for backend integration)
    API: {
        BASE_URL: window.location.origin,
        ENDPOINTS: {
            feeds: '/api/feeds',
            articles: '/api/aade-news',
            health: '/api/health'
        }
    }
};

// Make config globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
