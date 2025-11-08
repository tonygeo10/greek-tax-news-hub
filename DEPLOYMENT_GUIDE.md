# Deployment Guide - Greek Tax News Hub

## Overview
This guide provides step-by-step instructions for deploying the Greek Tax News Hub application to production.

## Prerequisites
- Node.js 18.x or 20.x
- SQL Server database (optional, app works without it)
- Hosting platform account (Railway, Vercel, Azure, Heroku, etc.)

---

## Option 1: Deploy to Railway (Recommended)

Railway is a simple platform that works great for Node.js apps.

### Steps:

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Install Railway CLI** (optional, for command-line deployment)
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Create New Project**
   - Click "New Project" in Railway dashboard
   - Select "Deploy from GitHub repo"
   - Choose your repository: `tonygeo10/greek-tax-news-hub`
   - Railway will auto-detect the Node.js project

4. **Configure Environment Variables**
   In Railway dashboard, add these variables:
   ```
   PORT=3000
   NODE_ENV=production
   DB_SERVER=your-database-server
   DB_NAME=GreekTaxNewsHub
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_ENCRYPT=true
   ```

5. **Set Root Directory**
   - In Railway settings, set "Root Directory" to: `backend/backend`
   - Set "Start Command" to: `npm start`

6. **Deploy**
   - Click "Deploy"
   - Railway will automatically build and deploy your app
   - You'll get a public URL like: `your-app.railway.app`

---

## Option 2: Deploy to Vercel

Vercel is great for serverless deployments.

### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Create `vercel.json` in backend/backend/**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   cd backend/backend
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add DB_SERVER
   vercel env add DB_NAME
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   ```

---

## Option 3: Deploy to Azure App Service

Azure provides good integration with SQL Server.

### Steps:

1. **Install Azure CLI**
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   az login
   ```

2. **Create Resource Group**
   ```bash
   az group create --name GreekTaxNewsHub --location eastus
   ```

3. **Create App Service Plan**
   ```bash
   az appservice plan create --name GreekTaxNewsHub-plan \
     --resource-group GreekTaxNewsHub --sku B1 --is-linux
   ```

4. **Create Web App**
   ```bash
   az webapp create --resource-group GreekTaxNewsHub \
     --plan GreekTaxNewsHub-plan --name greek-tax-news-hub \
     --runtime "NODE:20-lts"
   ```

5. **Configure Settings**
   ```bash
   az webapp config appsettings set --resource-group GreekTaxNewsHub \
     --name greek-tax-news-hub --settings \
     DB_SERVER="your-server" \
     DB_NAME="GreekTaxNewsHub" \
     DB_USER="your-user" \
     DB_PASSWORD="your-password" \
     NODE_ENV="production"
   ```

6. **Deploy**
   ```bash
   cd backend/backend
   zip -r deploy.zip .
   az webapp deployment source config-zip \
     --resource-group GreekTaxNewsHub \
     --name greek-tax-news-hub --src deploy.zip
   ```

---

## Option 4: Docker Deployment

For containerized deployments to any platform.

### Create `Dockerfile` in backend/backend/:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
```

### Create `.dockerignore`:
```
node_modules
npm-debug.log
.env
*.log
```

### Build and Deploy:

```bash
# Build image
docker build -t greek-tax-news-hub .

# Run locally for testing
docker run -p 3000:3000 \
  -e DB_SERVER=your-server \
  -e DB_NAME=GreekTaxNewsHub \
  -e DB_USER=your-user \
  -e DB_PASSWORD=your-password \
  greek-tax-news-hub

# Push to Docker Hub
docker tag greek-tax-news-hub yourusername/greek-tax-news-hub
docker push yourusername/greek-tax-news-hub
```

---

## Database Setup

### Option A: Create Azure SQL Database

```bash
# Create SQL Server
az sql server create --name greek-tax-news-sql \
  --resource-group GreekTaxNewsHub \
  --location eastus --admin-user dbadmin \
  --admin-password "YourPassword123!"

# Create Database
az sql db create --resource-group GreekTaxNewsHub \
  --server greek-tax-news-sql --name GreekTaxNewsHub \
  --service-objective S0

# Configure firewall
az sql server firewall-rule create \
  --resource-group GreekTaxNewsHub \
  --server greek-tax-news-sql \
  --name AllowAll --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

### Option B: Run Schema Manually

1. Connect to your SQL Server using SQL Server Management Studio or Azure Data Studio
2. Run the schema file: `backend/backend/sql/schema.sql`
3. Verify tables were created:
   ```sql
   SELECT * FROM RSSFeeds;
   SELECT * FROM Articles;
   ```

---

## Post-Deployment Verification

### 1. Test Health Endpoint
```bash
curl https://your-deployed-url/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Test Feeds Endpoint
```bash
curl https://your-deployed-url/api/feeds
```

Should return 12 feeds.

### 3. Test Articles Endpoint
```bash
curl https://your-deployed-url/api/articles/1?page=1&pageSize=5
```

Should return AADE articles.

### 4. Monitor Logs

Check application logs for errors:
- Railway: Dashboard → Deployments → Logs
- Vercel: Dashboard → Deployment → Runtime Logs
- Azure: Azure Portal → App Service → Log Stream

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| PORT | No | Server port | 3000 |
| NODE_ENV | Yes | Environment | production |
| DB_SERVER | Yes* | SQL Server host | server.database.windows.net |
| DB_NAME | Yes* | Database name | GreekTaxNewsHub |
| DB_USER | Yes* | Database user | dbadmin |
| DB_PASSWORD | Yes* | Database password | YourPassword123! |
| DB_ENCRYPT | Yes* | Use SSL for DB | true |

*Required only if using database. App works in RSS-only mode without database.

---

## Troubleshooting

### Server won't start
- Check logs for specific error messages
- Verify Node.js version is 18.x or 20.x
- Ensure all environment variables are set

### Database connection fails
- Verify SQL Server is accessible from your hosting platform
- Check firewall rules allow connections
- Verify credentials are correct
- The app will work in fallback mode (RSS-only) if DB is unavailable

### RSS feeds not loading
- Ensure server has internet access to external URLs
- Check if hosting platform has outbound restrictions
- Verify feed URLs are still valid

### 502/503 Errors
- Check if server is running (health endpoint)
- Verify port configuration matches hosting platform
- Check application logs for crashes

---

## Monitoring Recommendations

1. **Uptime Monitoring**: Use UptimeRobot or Pingdom to monitor endpoint availability
2. **Error Tracking**: Integrate Sentry or similar for error tracking
3. **Logging**: Winston logs are already configured - ensure they're being captured
4. **Performance**: Monitor API response times and database query performance

---

## Security Recommendations

1. **Enable HTTPS**: Ensure all API traffic uses HTTPS (most platforms do this automatically)
2. **Add Rate Limiting**: Install and configure `express-rate-limit` for production
3. **Secure Environment Variables**: Never commit `.env` file, use platform secrets management
4. **Database Security**: Use strong passwords, enable SSL, restrict firewall access
5. **CORS Configuration**: Update CORS settings for your specific domain in production

---

## Rollback Procedure

If you need to rollback to a previous version:

### Railway/Vercel:
- Use dashboard to select a previous deployment
- Click "Redeploy"

### Azure:
```bash
az webapp deployment source config-zip \
  --resource-group GreekTaxNewsHub \
  --name greek-tax-news-hub --src previous-version.zip
```

### Docker:
```bash
docker pull yourusername/greek-tax-news-hub:previous-tag
docker run ... # with previous tag
```

---

## Support

For issues or questions:
- Check logs first
- Review the README.md for API documentation
- Check IMPLEMENTATION_SUMMARY.md for technical details
- Open an issue on GitHub: https://github.com/tonygeo10/greek-tax-news-hub/issues

---

**Last Updated**: 2025-11-08  
**Version**: 1.0.0
