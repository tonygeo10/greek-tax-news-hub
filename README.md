# Greek Tax News Hub

A comprehensive RSS news aggregator for Greek tax updates from official sources. This is a client-side web application that allows users to add, manage, and read RSS feeds with a clean, modern interface.

## Features

- 📰 **RSS Feed Parsing**: Parse and display RSS feeds from any source
- 💾 **Local Storage**: Automatically save your feeds in browser storage
- 🎨 **Modern UI**: Clean, responsive design that works on all devices
- 🔄 **Real-time Updates**: Fetch the latest articles from your feeds
- 🌐 **CORS Proxy**: Handle feeds that don't support CORS
- 🔍 **Pagination**: Easy navigation through large numbers of articles
- ⚡ **Fast & Lightweight**: Pure JavaScript with no heavy frameworks

## Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tonygeo10/greek-tax-news-hub.git
   cd greek-tax-news-hub
   ```

2. **Open the application**
   
   Option A: Using a local web server (recommended)
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```
   
   Then open your browser and navigate to: `http://localhost:8000`

   Option B: Direct file access
   - Simply open `index.html` in your web browser
   - Note: Some features may be limited due to browser security restrictions

### Usage

1. **Add RSS Feeds**
   - Enter an RSS feed URL in the input field
   - Click "Add Feed" button
   - The feed will be saved automatically and articles will load

2. **Default Feed**
   - The app comes with a default Greek Tax Authority (AADE) RSS feed
   - URL: `https://www.aade.gr/deltia-typoy-anakoinoseis?format=rss`

3. **Manage Feeds**
   - Click the "×" button on any feed tag to remove it
   - Use "Clear All" to remove all feeds at once
   - Your feeds are saved in browser localStorage

4. **Read Articles**
   - Articles are displayed in a responsive grid
   - Click on article titles to open them in a new tab
   - Use pagination controls to navigate through articles

## Project Structure

```
greek-tax-news-hub/
├── index.html          # Main HTML file with semantic structure
├── css/
│   └── styles.css      # Custom CSS with modern responsive design
├── js/
│   └── script.js       # RSS parser and application logic
├── backend/            # Optional backend server (Node.js)
│   └── server.js       # Express server with RSS parsing
├── README.md           # This file
└── .github/            # GitHub workflows and configurations
```

## Technical Details

### RSS Parsing
- Uses native browser `DOMParser` for XML parsing
- CORS proxy (`allorigins.win`) for feeds that don't support CORS
- Supports standard RSS 2.0 format
- Extracts: title, description, link, publication date

### Local Storage
- Feeds are saved to `localStorage` under the key `rssFeeds`
- Persists across browser sessions
- Data is stored as JSON array

### Styling
- CSS Variables for easy theming
- Flexbox and Grid layouts for responsiveness
- Mobile-first design approach
- Smooth animations and transitions

### Browser Compatibility
- Modern browsers (ES6+ support required)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Customization

### Change Color Scheme
Edit CSS variables in `css/styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    /* ... other colors */
}
```

### Modify CORS Proxy
Edit the proxy URL in `js/script.js`:
```javascript
this.corsProxy = 'https://your-cors-proxy.com/';
```

### Adjust Pagination
Change articles per page in `js/script.js`:
```javascript
this.articlesPerPage = 12; // Change this number
```

## Backend Server (Optional)

The project includes an optional Node.js backend server for enhanced functionality:

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with database configuration (if using database)

4. **Run the server**
   ```bash
   npm start
   ```

5. **Access the API**
   - Health check: `http://localhost:3000/api/health`
   - Get feeds: `http://localhost:3000/api/feeds`
   - Get articles: `http://localhost:3000/api/aade-news`

## Troubleshooting

### Feeds not loading
- Check if the RSS feed URL is correct and accessible
- Some feeds may require CORS proxy (already implemented)
- Check browser console for error messages

### Articles not displaying
- Ensure the feed uses standard RSS 2.0 format
- Check if the feed has valid `<item>` elements
- Try clearing localStorage and re-adding the feed

### Styling issues
- Clear browser cache and reload
- Ensure `css/styles.css` is properly linked
- Check browser developer tools for CSS errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for educational purposes.

## Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This application uses a third-party CORS proxy service. For production use, consider setting up your own CORS proxy or using a backend server to fetch RSS feeds.
