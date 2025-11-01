/ Enhanced RSS Parser class with better real-world handling
class RSSParser {
    static async parseRSSFeed(url) {
        try {
            console.log(`🔍 Starting RSS parsing for: ${url}`);
            
            // Enhanced proxy list with specialized RSS services
            const proxies = [
                // RSS-specific proxies first
                `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
                `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
                // General CORS proxies
                `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
                `https://cors.sh/${url}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`,
                `https://proxy.cors.sh/${url}`,
                // Backup options
                `https://jsonp.afeld.me/?url=${encodeURIComponent(url)}`,
                // Direct attempt (might work for some feeds)
                url
            ];
            
            let articles = [];
            let lastError = null;
            let workingProxy = null;
            
            // Try each proxy with specialized handling
            for (let i = 0; i < proxies.length; i++) {
                const proxyUrl = proxies[i];
                
                try {
                    const proxyName = this.getProxyName(proxyUrl);
                    console.log(`📡 Trying ${proxyName} (${i + 1}/${proxies.length})`);
                    
                    const fetchOptions = {
                        method: 'GET',
                        headers: this.getProxyHeaders(proxyUrl),
                        signal: AbortSignal.timeout(20000) // Increased timeout
                    };
                    
                    const response = await fetch(proxyUrl, fetchOptions);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    // Handle different proxy response formats
                    articles = await this.processProxyResponse(response, proxyUrl, url);
                    
                    if (articles && articles.length > 0) {
                        workingProxy = proxyName;
                        console.log(`✅ Successfully parsed ${articles.length} articles via ${proxyName}`);
                        break;
                    } else {
                        throw new Error('No articles found in response');
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`❌ ${this.getProxyName(proxyUrl)} failed:`, error.message);
                    
                    // Progressive delay between attempts
                    if (i < proxies.length - 1) {
                        const delay = Math.min(1000 * (i + 1), 3000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    continue;
                }
            }
            
            if (!articles || articles.length === 0) {
                throw new Error(`All ${proxies.length} proxies failed. Last error: ${lastError?.message || 'Unknown error'}`);
            }
            
            console.log(`🎉 RSS parsing completed: ${articles.length} articles from ${workingProxy}`);
            return articles;
            
        } catch (error) {
            console.error(`💥 RSS parsing failed for ${url}:`, error);
            throw new Error(`RSS parsing failed: ${error.message}`);
        }
    }
    
    static getProxyName(proxyUrl) {
        if (proxyUrl.includes('rss2json.com')) return 'RSS2JSON';
        if (proxyUrl.includes('allorigins.win')) return 'AllOrigins';
        if (proxyUrl.includes('thingproxy.freeboard.io')) return 'ThingProxy';
        if (proxyUrl.includes('cors.sh')) return 'CORS.sh';
        if (proxyUrl.includes('corsproxy.io')) return 'CORSProxy.io';
        if (proxyUrl.includes('jsonp.afeld.me')) return 'JSONProxy';
        return 'Direct';
    }
    
    static getProxyHeaders(proxyUrl) {
        const baseHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/json, */*',
            'Accept-Language': 'en-US,en;q=0.9,el;q=0.8',
            'Cache-Control': 'no-cache'
        };
        
        // Specialized headers for different proxies
        if (proxyUrl.includes('rss2json.com')) {
            return { ...baseHeaders, 'Accept': 'application/json' };
        }
        
        if (proxyUrl.includes('allorigins.win')) {
            return { ...baseHeaders, 'Accept': 'application/json' };
        }
        
        return baseHeaders;
    }
    
    static async processProxyResponse(response, proxyUrl, originalUrl) {
        const contentType = response.headers.get('content-type') || '';
        
        // Handle RSS2JSON format
        if (proxyUrl.includes('rss2json.com')) {
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
                return data.items.map((item, index) => this.parseRSS2JSONItem(item, originalUrl, index));
            } else {
                throw new Error(`RSS2JSON error: ${data.message || 'Invalid response'}`);
            }
        }
        
        // Handle AllOrigins format
        if (proxyUrl.includes('allorigins.win')) {
            const data = await response.json();
            if (data.contents) {
                return this.parseXMLContent(data.contents, originalUrl);
            } else {
                throw new Error('AllOrigins: No content in response');
            }
        }
        
        // Handle JSON responses from other proxies
        if (contentType.includes('application/json')) {
            const data = await response.json();
            const xmlContent = data.contents || data.body || data.data || data;
            
            if (typeof xmlContent === 'string') {
                return this.parseXMLContent(xmlContent, originalUrl);
            } else {
                throw new Error('JSON response does not contain XML content');
            }
        }
        
        // Handle direct XML responses
        const xmlText = await response.text();
        return this.parseXMLContent(xmlText, originalUrl);
    }
    
    static parseRSS2JSONItem(item, sourceUrl, index) {
        return {
            id: this.generateArticleId(item.title || 'Untitled', item.link || '', item.pubDate || ''),
            title: this.cleanText(item.title || 'Untitled'),
            description: this.cleanText(item.description || item.content || ''),
            source_url: item.link || item.guid || sourceUrl,
            pub_date: this.parseDate(item.pubDate),
            read: false,
            bookmarked: false,
            created_at: new Date().toISOString()
        };
    }
    
    static parseXMLContent(xmlText, sourceUrl) {
        // Clean and validate XML
        xmlText = this.cleanXML(xmlText);
        
        // Parse XML with enhanced error handling
        const xmlDoc = this.parseXMLSafely(xmlText);
        
        // Extract articles using multiple strategies
        return this.extractArticles(xmlDoc, sourceUrl);
    }
    
    static cleanXML(xmlText) {
        // Remove BOM and other problematic characters
        xmlText = xmlText.replace(/^\uFEFF/, ''); // Remove BOM
        xmlText = xmlText.replace(/^[^<]*</, '<'); // Remove content before first tag
        xmlText = xmlText.replace(/>[^<]*$/, '>'); // Remove content after last tag
        
        // Fix common XML issues
        xmlText = xmlText.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;'); // Fix unescaped ampersands
        xmlText = xmlText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
        
        return xmlText.trim();
    }
    
    static parseXMLSafely(xmlText) {
        const parser = new DOMParser();
        
        // First attempt: Parse as XML
        let xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for parsing errors
        let parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            // Second attempt: Try as HTML (more forgiving)
            xmlDoc = parser.parseFromString(xmlText, 'text/html');
            
            // If still no valid structure, try manual cleanup
            if (!xmlDoc.querySelector('item, entry')) {
                // Third attempt: Clean up and try again
                const cleanedXML = this.repairXML(xmlText);
                xmlDoc = parser.parseFromString(cleanedXML, 'text/xml');
                
                parseError = xmlDoc.querySelector('parsererror');
                if (parseError) {
                    throw new Error(`XML parsing failed: ${parseError.textContent}`);
                }
            }
        }
        
        return xmlDoc;
    }
    
    static repairXML(xmlText) {
        // Basic XML repair attempts
        try {
            // Fix unclosed tags (basic attempt)
            xmlText = xmlText.replace(/<([^/>]+)>([^<]*?)(?=<[^/])/g, '<$1>$2</$1>');
            
            // Ensure proper XML declaration
            if (!xmlText.includes('<?xml')) {
                xmlText = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlText;
            }
            
            return xmlText;
        } catch (error) {
            return xmlText; // Return original if repair fails
        }
    }
    
    static extractArticles(xmlDoc, sourceUrl) {
        const articles = [];
        
        // Try RSS 2.0 format first
        let items = xmlDoc.querySelectorAll('item');
        
        // If no items, try Atom format
        if (items.length === 0) {
            items = xmlDoc.querySelectorAll('entry');
        }
        
        items.forEach((item, index) => {
            try {
                const article = this.parseItem(item, sourceUrl, index);
                if (article) {
                    articles.push(article);
                }
            } catch (error) {
                console.warn('Error parsing RSS item:', error);
            }
        });
        
        return articles;
    }
    
    static parseItem(item, sourceUrl, index) {
        // Extract title
        let title = this.getTextContent(item, 'title') || 'Untitled';
        title = this.cleanText(title);
        
        // Extract description
        let description = this.getTextContent(item, 'description') || 
                        this.getTextContent(item, 'summary') ||
                        this.getTextContent(item, 'content') || '';
        description = this.cleanText(description);
        
        // Extract link
        let link = this.getTextContent(item, 'link') || 
                  this.getTextContent(item, 'guid') ||
                  item.querySelector('link')?.getAttribute('href') || '';
        
        // Extract publication date
        let pubDate = this.getTextContent(item, 'pubDate') || 
                     this.getTextContent(item, 'published') ||
                     this.getTextContent(item, 'updated') ||
                     new Date().toISOString();
        
        // Parse and format date
        try {
            pubDate = new Date(pubDate).toISOString();
        } catch {
            pubDate = new Date().toISOString();
        }
        
        // Generate unique ID
        const id = this.generateArticleId(title, link, pubDate);
        
        return {
            id: id,
            title: title,
            description: description,
            source_url: link,
            pub_date: pubDate,
            read: false,
            bookmarked: false,
            created_at: new Date().toISOString()
        };
    }
    
    static getTextContent(item, tagName) {
        const element = item.querySelector(tagName);
        return element ? element.textContent.trim() : null;
    }
    
    static cleanText(text) {
        // Remove HTML tags and clean up text
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace &amp; with &
            .replace(/&lt;/g, '<') // Replace &lt; with <
            .replace(/&gt;/g, '>') // Replace &gt; with >
            .replace(/&quot;/g, '"') // Replace &quot; with "
            .replace(/&#39;/g, "'") // Replace &#39; with '
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }
    
    static parseDate(dateString) {
        if (!dateString) return new Date().toISOString();
        
        try {
            // Handle various date formats
            let date = new Date(dateString);
            
            // If invalid, try parsing common RSS date formats
            if (isNaN(date.getTime())) {
                // Try RFC 2822 format (e.g., "Wed, 18 Oct 2023 14:30:00 +0000")
                const rfc2822Match = dateString.match(/(\w{3}),?\s+(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
                if (rfc2822Match) {
                    date = new Date(dateString);
                }
                
                // Try ISO format variations
                if (isNaN(date.getTime())) {
                    const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
                    if (isoMatch) {
                        date = new Date(dateString);
                    }
                }
                
                // Fallback to current date if still invalid
                if (isNaN(date.getTime())) {
                    date = new Date();
                }
            }
            
            return date.toISOString();
        } catch (error) {
            console.warn('Date parsing failed:', dateString, error);
            return new Date().toISOString();
        }
    }
    
    static generateArticleId(title, link, pubDate) {
        // Create a unique ID based on title, link, and date
        const content = `${title}-${link}-${pubDate}`;
        return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + '-' + Date.now();
    }
}
