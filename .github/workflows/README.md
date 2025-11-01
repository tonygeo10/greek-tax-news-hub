# Greek Tax News Hub 🇬🇷

A comprehensive RSS news aggregator for Greek tax updates from official sources including AADE, TaxHeaven, and Forin.gr.

![Greek Tax News Hub](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-success)

## 🌟 Features

- **Multi-Source RSS Parsing**: Aggregates news from 6+ official Greek tax sources
- **Smart Proxy System**: Uses 8 different proxy services for reliable RSS access
- **Real-time Updates**: Auto-refresh functionality with configurable intervals
- **Advanced Filtering**: Filter by source, category, read status, and bookmarks
- **Offline Storage**: Uses localStorage for persistent data storage
- **Mobile Responsive**: Works perfectly on all devices
- **Greek Language Support**: Full Greek language interface and content

## 🚀 Live Demo

Visit the live application: [https://yourusername.github.io/greek-tax-news-hub/](https://yourusername.github.io/greek-tax-news-hub/)

## 📊 Supported Sources

- **AADE Official** - Government announcements
- **Forin.gr** - Tax & accounting news  
- **TaxHeaven News** - Latest tax news
- **TaxHeaven Decisions** - Court decisions
- **TaxHeaven Laws** - New legislation
- **TaxHeaven Deadlines** - Important dates

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Storage**: localStorage API
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## 📦 Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/greek-tax-news-hub.git
cd greek-tax-news-hub

Open index.html in your browser or use a local server:
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000

Navigate to http://localhost:8000
GitHub Pages Deployment
Fork this repository
Go to Settings → Pages
Select "Deploy from a branch"
Choose "main" branch
Your site will be available at https://yourusername.github.io/greek-tax-news-hub/
🎯 Usage
Adding RSS Feeds
Quick Add: Use the pre-configured Greek tax sources
Manual Add: Click "Add RSS Feed" and enter custom URLs
Bulk Import: Import all popular sources at once
Managing Content
Bookmark articles for later reading
Mark as read to track your progress
Filter by source, category, or status
Auto-refresh to get latest updates
Feed Management
Enable/disable specific feeds
Set refresh intervals (5min to 1hour)
Monitor feed status and error handling
Remove feeds you no longer need
🔧 Configuration
RSS Sources
Edit the popularFeeds array in js/app.js to add more sources:

const popularFeeds = [
    { 
        url: 'https://example.com/rss', 
        name: 'Source Name', 
        category: 'news' 
    }
];

Proxy Services
The app uses multiple proxy services for RSS parsing. Configure in js/rss-parser.js:

RSS2JSON API
AllOrigins
ThingProxy
CORS.sh
CORSProxy.io
JSONProxy
🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🐛 Issues & Support
Bug Reports: https://github.com/yourusername/greek-tax-news-hub/issues
Feature Requests: https://github.com/yourusername/greek-tax-news-hub/discussions
Documentation: https://github.com/yourusername/greek-tax-news-hub/wiki
📈 Roadmap
[ ] Email notifications for new articles
[ ] Export functionality (PDF, CSV)
[ ] Advanced search capabilities
[ ] Dark mode theme
[ ] PWA support for offline reading
[ ] Multi-language support
🙏 Acknowledgments
Greek tax authorities for providing RSS feeds
Tailwind CSS for the styling framework
All proxy service providers for CORS handling
Made with ❤️ for the Greek tax community
