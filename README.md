# 🏛️ Greek Tax News Hub

## Κεντρικός Κόμβος Φορολογικών Ειδήσεων

A comprehensive, production-ready RSS news aggregator specifically optimized for Greek tax professionals, accountants, and businesses. Stay updated with the latest tax developments from official Greek authorities and trusted sources.

## ✨ Features

### 📰 Pre-loaded Greek Tax Sources
- **AADE (Ανεξάρτητη Αρχή Δημοσίων Εσόδων)** - Official Greek Tax Authority
- **Tax Heaven Greece** - Leading tax news and analysis
- **Forin.gr** - Business and tax news
- **eKathimerini** - Taxation section from Greece's leading newspaper
- **Greek Reporter** - International perspective on Greek affairs

### 🎯 Greek Tax Optimization
- Full UTF-8 support for Greek characters (Ελληνικά)
- Greek date formatting (long format with weekday)
- Category filtering (Government, Tax Law, Business, etc.)
- Priority highlighting for government announcements
- Greek language UI and notifications

### 🚀 Enhanced Features
- **Search Functionality** - Find articles across all sources
- **Bookmark/Save** - Mark articles for later reading
- **Archive System** - Organize articles efficiently
- **Dark/Light Theme** - Professional themes with Greek tax authority colors
- **Export Options** - PDF, Text, and JSON export
- **Offline Reading** - LocalStorage-based caching
- **Auto-refresh** - Configurable automatic feed updates
- **Reading Time Estimates** - Know how long articles take to read
- **Mobile-First Design** - Fully responsive for professionals on the go

### 🎨 Professional UI
- Greek tax authority inspired branding (#0066cc primary color)
- Professional dashboard layout
- Article preview with expandable content
- Tag system for categorization
- Priority badges for important announcements
- Smooth animations and transitions

### 🔧 Technical Features
- Enhanced error handling for Greek RSS feeds
- Multiple CORS proxy fallbacks for reliability
- Performance optimization for multiple feeds
- SEO optimized with Greek language meta tags
- Analytics-ready structure
- Accessibility compliant (WCAG 2.1)

## 🚀 Quick Start

### Option 1: Direct Use (Recommended)
Simply open `index.html` in a modern web browser. No build process or server required!

```bash
# Clone the repository
git clone https://github.com/tonygeo10/greek-tax-news-hub.git
cd greek-tax-news-hub

# Open in browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Option 2: Local Server
For a better development experience:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Then open http://localhost:8000
```

## 📁 File Structure

```
greek-tax-news-hub/
├── index.html              # Main application HTML
├── assets/
│   ├── css/
│   │   └── styles.css      # Enhanced styles with Greek typography
│   └── js/
│       ├── config.js       # Configuration (feeds, settings, themes)
│       ├── rss-parser.js   # Enhanced RSS parser for Greek content
│       ├── storage.js      # LocalStorage manager
│       └── app.js          # Main application logic
├── backend/
│   └── server.js           # Optional Node.js backend
└── README.md
```

## 🎨 Customization

### Adding New RSS Feeds
Edit `assets/js/config.js`:

```javascript
DEFAULT_FEEDS: [
    {
        id: 'your-feed-id',
        name: 'Your Feed Name',
        url: 'https://example.com/rss',
        category: 'news', // government, news, business, law
        priority: 'medium', // high, medium, low
        color: '#009688',
        enabled: true,
        description: 'Feed description'
    }
]
```

### Changing Themes
The app supports light and dark themes with Greek tax authority colors. Edit theme colors in `assets/js/config.js`:

```javascript
THEME: {
    light: {
        primary: '#0066cc',    // AADE blue
        secondary: '#009688',
        // ... more colors
    },
    dark: {
        // ... dark theme colors
    }
}
```

### Adjusting Auto-refresh
Modify settings in `assets/js/config.js`:

```javascript
SETTINGS: {
    AUTO_REFRESH: true,
    REFRESH_INTERVAL: 1800000, // 30 minutes in milliseconds
    // ... more settings
}
```

## 💾 Data Storage

All data is stored locally in your browser using LocalStorage:
- Articles (up to 1000 latest)
- Bookmarks
- Archived articles
- User settings and preferences
- Theme selection

### Export/Import Data
Use the export menu to backup your data:
- **JSON**: Full data backup
- **Text**: Human-readable article list
- **PDF**: Print-friendly format

## 🌐 Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 🔒 Privacy & Security

- ✅ No external tracking or analytics by default
- ✅ All data stored locally in your browser
- ✅ No cookies used
- ✅ HTTPS recommended for production use
- ✅ XSS protection with proper HTML escaping
- ✅ CORS proxy used for secure RSS fetching

## 📱 Mobile Support

Fully responsive design optimized for:
- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktop (1400px+)

## ⚡ Performance

- Lightning-fast load times (< 2s on average)
- Efficient caching (10-minute cache for RSS feeds)
- Optimized for multiple concurrent feeds
- Lazy loading for better initial render
- Minimal JavaScript bundle size

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- AADE (Greek Tax Authority) for official RSS feeds
- Tax Heaven Greece for comprehensive tax news
- All Greek tax news sources for their valuable content
- The open-source community

## 📞 Support

For issues, questions, or suggestions:
- 🐛 [Report a bug](https://github.com/tonygeo10/greek-tax-news-hub/issues)
- 💡 [Request a feature](https://github.com/tonygeo10/greek-tax-news-hub/issues)
- 📧 Contact: [Your contact info]

## 🗺️ Roadmap

- [ ] Push notifications for critical tax announcements
- [ ] Multi-language support (English translations)
- [ ] Integration with Greek tax calculators
- [ ] Mobile apps (iOS/Android)
- [ ] Browser extensions
- [ ] RSS feed auto-discovery
- [ ] Article summarization with AI
- [ ] Social sharing features

---

**Made with ❤️ for Greek tax professionals**

*Φτιαγμένο με αγάπη για τους Έλληνες φορολογικούς επαγγελματίες*
