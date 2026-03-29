# GitHub Pages Deployment Guide

## Overview
This guide will help you deploy the Greek Tax News Hub frontend to GitHub Pages.

## Prerequisites
- Repository hosted on GitHub
- GitHub Pages enabled in repository settings
- Main branch merged with all changes

## Automatic Deployment (Recommended)

### Step 1: Enable GitHub Pages
1. Go to your repository on GitHub: https://github.com/tonygeo10/greek-tax-news-hub
2. Click on **Settings** (top navigation)
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select:
   - **Deploy from a branch** OR **GitHub Actions** (recommended)
5. If using branch deployment:
   - Branch: `main`
   - Folder: `/ (root)`
6. Click **Save**

### Step 2: Merge This PR
1. Review and approve this pull request
2. Merge to `main` branch
3. The GitHub Actions workflow will automatically:
   - Build the site
   - Deploy to GitHub Pages
   - Provide a URL (usually: https://tonygeo10.github.io/greek-tax-news-hub/)

### Step 3: Verify Deployment
1. Go to **Actions** tab in your repository
2. Check the "Deploy to GitHub Pages" workflow
3. Wait for it to complete (green checkmark ✅)
4. Visit your GitHub Pages URL

## What Gets Deployed

The following files are deployed to GitHub Pages:
- `index.html` - Main frontend application
- Frontend assets (CSS, JavaScript)
- Documentation files (README, guides)

**Note:** The backend API (`backend/backend/server.js`) is NOT deployed to GitHub Pages since it's a static hosting service. You'll need to deploy the backend separately (see DEPLOYMENT_GUIDE.md).

## Backend API Configuration

Since GitHub Pages only hosts static files, you need to:

1. **Deploy Backend Separately**: Use Railway, Vercel, Azure, or Docker (see DEPLOYMENT_GUIDE.md)

2. **Update Frontend API URL**: Edit `index.html` to point to your deployed backend:
   ```javascript
   const API_BASE_URL = 'https://your-backend-url.railway.app';
   ```

## Workflow File Details

The deployment workflow (`.github/workflows/deploy.yml`) will:
1. Trigger on push to `main` branch
2. Build the site
3. Upload artifacts
4. Deploy to GitHub Pages
5. Provide deployment URL

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# 1. Clone the repository
git clone https://github.com/tonygeo10/greek-tax-news-hub.git
cd greek-tax-news-hub

# 2. Checkout main branch
git checkout main

# 3. Push to gh-pages branch
git subtree push --prefix . origin gh-pages
```

## Troubleshooting

### Deployment fails
- Check **Actions** tab for error messages
- Verify GitHub Pages is enabled in Settings
- Ensure workflow has proper permissions
- Check if there are any syntax errors in HTML/JS

### Site shows 404
- Wait a few minutes for DNS propagation
- Check if GitHub Pages is enabled
- Verify the correct branch/folder is selected
- Clear browser cache

### Backend API not working
- Remember: GitHub Pages is static only
- Deploy backend separately (see DEPLOYMENT_GUIDE.md)
- Update API_BASE_URL in frontend code
- Check CORS settings on backend

## GitHub Pages vs Full Deployment

### GitHub Pages (Frontend Only)
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Good for static content
- ❌ No backend/API support
- ❌ No server-side processing

### Full Deployment (Frontend + Backend)
- Use Railway, Vercel, Azure (see DEPLOYMENT_GUIDE.md)
- ✅ Backend API support
- ✅ Database connectivity
- ✅ RSS feed processing
- 💰 May require payment

## Recommended Architecture

For best results:
1. **Frontend**: Deploy to GitHub Pages (free, fast)
2. **Backend API**: Deploy to Railway/Vercel (see DEPLOYMENT_GUIDE.md)
3. **Database**: Azure SQL or cloud database
4. **Configuration**: Update frontend to use deployed backend URL

## Next Steps

1. ✅ Merge this PR to `main`
2. ✅ Wait for GitHub Actions to complete
3. ✅ Visit your GitHub Pages URL
4. 🔧 Deploy backend separately (DEPLOYMENT_GUIDE.md)
5. 🔧 Update frontend API URL to point to backend
6. 🔧 Configure database connection
7. ✅ Test the full application

## Support

For issues:
- Check GitHub Actions logs
- Review browser console for errors
- See DEPLOYMENT_GUIDE.md for backend deployment
- Open an issue on GitHub

---

**GitHub Pages URL**: https://tonygeo10.github.io/greek-tax-news-hub/  
**Repository**: https://github.com/tonygeo10/greek-tax-news-hub  
**Last Updated**: 2025-11-08
