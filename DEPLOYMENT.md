# GraveGrounds Faction Tracker - Deployment Guide

This guide will walk you through deploying your faction tracker backend to Railway for free hosting with real-time updates.

## 🚀 Quick Deploy to Railway

### Step 1: Prepare Your Repository
1. **Push your code to GitHub** (if you haven't already)
2. **Make sure you have these files:**
   - `package.json` ✅
   - `server.js` ✅
   - `railway.json` ✅
   - All your HTML/CSS/JS files ✅

### Step 2: Deploy to Railway
1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Railway will automatically detect it's a Node.js app**

### Step 3: Configure Environment Variables
1. **In your Railway project dashboard:**
2. **Go to "Variables" tab**
3. **Add these variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```
4. **Click "Add"**

### Step 4: Deploy
1. **Railway will automatically build and deploy**
2. **Wait for the build to complete** (usually 2-3 minutes)
3. **Your app will be live at a URL like:** `https://your-app-name-production.up.railway.app`

## 🔧 Local Development Setup

### Prerequisites
- **Node.js 16+** installed
- **npm** or **yarn**

### Install Dependencies
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Access Locally
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api/factions

## 📊 Database Setup

The app uses **SQLite** which is automatically created when you first run the server.

### Database Location
- **Local:** `./factions.db` (in your project folder)
- **Railway:** Automatically managed by Railway

### Database Tables
- **users** - Stores user accounts and faction choices
- **faction_stats** - Stores real-time member counts

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/factions` - Get all faction statistics
- `GET /api/factions/:faction` - Get specific faction stats

### Authentication Required
- `POST /api/signup` - Create new user account
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (requires JWT token)

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT authentication** for protected routes
- **Rate limiting** (100 requests per 15 minutes per IP)
- **CORS enabled** for cross-origin requests
- **Input validation** on all endpoints

## 📱 Real-Time Updates

The app uses **Socket.IO** for real-time updates:
- **Member counts update instantly** when someone signs up
- **All connected users see changes** in real-time
- **Automatic reconnection** if connection is lost

## 🚨 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
npm install
```

#### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

#### Database errors
```bash
# Delete the database file and restart
rm factions.db
npm run dev
```

#### Railway deployment fails
1. **Check build logs** in Railway dashboard
2. **Verify package.json** has correct scripts
3. **Ensure all dependencies** are in package.json

### Railway-Specific Issues

#### App goes to sleep
- **Free tier limitation** - app sleeps after 15 minutes of inactivity
- **First request wakes it up** - takes 10-15 seconds
- **Upgrade to paid plan** for always-on hosting

#### Environment variables not working
1. **Check Railway Variables tab**
2. **Redeploy after adding variables**
3. **Verify variable names** match exactly

## 🔄 Updating Your App

### Local Changes
1. **Make your changes**
2. **Test locally:** `npm run dev`
3. **Commit and push to GitHub**

### Railway Auto-Deploy
- **Railway automatically deploys** when you push to GitHub
- **No manual deployment needed**
- **Check Railway dashboard** for deployment status

## 📈 Monitoring & Analytics

### Railway Dashboard
- **Deployment status**
- **Build logs**
- **Environment variables**
- **Usage statistics**

### Application Logs
- **View logs in Railway dashboard**
- **Real-time log streaming**
- **Error tracking**

## 🎯 Next Steps

### After Deployment
1. **Test signup/login** functionality
2. **Verify real-time updates** work
3. **Check all faction pages** load correctly
4. **Test navigation** between pages

### Potential Enhancements
- **Custom domain** setup
- **SSL certificate** (automatic with Railway)
- **Database backups**
- **Performance monitoring**

## 🆘 Support

### Railway Support
- **Documentation:** [docs.railway.app](https://docs.railway.app)
- **Discord:** [Railway Discord](https://discord.gg/railway)
- **GitHub Issues:** [Railway GitHub](https://github.com/railwayapp)

### Your App Issues
- **Check Railway logs** first
- **Verify environment variables**
- **Test locally** to isolate issues
- **Check browser console** for frontend errors

---

**🎉 Congratulations!** Your faction tracker is now live with real-time updates, accurate member counts, and professional hosting.

**Remember:** The free tier will put your app to sleep after 15 minutes of inactivity, but it wakes up automatically when someone visits!
