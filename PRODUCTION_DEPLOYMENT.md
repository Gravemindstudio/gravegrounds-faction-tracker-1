# 🚀 Production Deployment Guide

## ⚠️ CRITICAL: Security Setup Required

**DO NOT DEPLOY** until you complete these security steps:

### 1. Environment Variables Setup

1. **Create `.env` file** (copy from `env.example`):
   ```bash
   cp env.example .env
   ```

2. **Generate a secure JWT secret**:
   ```bash
   # Generate a random 64-character secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update `.env` with your values**:
   ```env
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=your-generated-secret-here
   JWT_EXPIRES_IN=24h
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

### 2. Railway Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Deploy to Railway**:
   - Push to GitHub
   - Connect Railway to your repo
   - Add environment variables in Railway dashboard

3. **Required Railway Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-jwt-secret
   ALLOWED_ORIGINS=https://your-app-name.up.railway.app
   ```

### 3. Security Checklist

- [ ] JWT secret is set and secure (64+ characters)
- [ ] CORS origins are restricted to your domain
- [ ] Environment variables are set in Railway
- [ ] No hardcoded secrets in code
- [ ] HTTPS is enabled (automatic with Railway)

## 🔧 Pre-Deployment Testing

### Local Testing
```bash
# Install dependencies
npm install

# Create .env file with test values
cp env.example .env
# Edit .env with test values

# Test locally
npm run dev
```

### Test Endpoints
- [ ] `/api/factions` - Returns faction data
- [ ] `/api/signup` - User registration works
- [ ] `/api/login` - Authentication works
- [ ] File uploads work
- [ ] NSFW detection works

## 🚨 Security Warnings

### Current Vulnerabilities (Fixed)
- ✅ JWT secret now uses environment variables
- ✅ CORS is configurable for production
- ✅ Rate limiting is configurable
- ✅ File upload limits are configurable

### Still Need Attention
- ⚠️ No HTTPS enforcement in code (Railway handles this)
- ⚠️ No input sanitization for XSS protection
- ⚠️ No CSRF protection
- ⚠️ No request logging/monitoring

## 📊 Monitoring Setup

### Railway Dashboard
- Monitor deployment status
- Check build logs
- Monitor resource usage
- View application logs

### Recommended Additions
- Set up error tracking (Sentry)
- Add request logging
- Monitor database performance
- Set up uptime monitoring

## 🔄 Post-Deployment

### 1. Test Production
- [ ] Sign up new user
- [ ] Login works
- [ ] File uploads work
- [ ] Real-time updates work
- [ ] All pages load correctly

### 2. Security Verification
- [ ] JWT tokens are properly signed
- [ ] CORS only allows your domain
- [ ] Rate limiting is active
- [ ] No sensitive data in logs

### 3. Performance Check
- [ ] Page load times are acceptable
- [ ] Database queries are fast
- [ ] File uploads work within limits
- [ ] Real-time updates are responsive

## 🆘 Troubleshooting

### Common Issues

#### "JWT_SECRET not set"
- Add JWT_SECRET to Railway environment variables
- Redeploy the application

#### "CORS errors"
- Check ALLOWED_ORIGINS in Railway
- Ensure your domain is included
- Redeploy after changes

#### "Database errors"
- Check Railway logs
- Verify database file permissions
- Restart the application

#### "File upload fails"
- Check MAX_FILE_SIZE setting
- Verify uploads directory exists
- Check file permissions

### Railway-Specific Issues

#### App goes to sleep
- Free tier limitation
- First request takes 10-15 seconds
- Consider upgrading for always-on hosting

#### Build fails
- Check package.json dependencies
- Verify Node.js version compatibility
- Check build logs in Railway dashboard

## 📈 Scaling Considerations

### Current Limitations
- SQLite database (single file)
- File storage on server
- No load balancing
- No caching layer

### Future Improvements
- Migrate to PostgreSQL
- Use cloud storage (AWS S3)
- Add Redis for caching
- Implement load balancing

## 🔒 Security Best Practices

### Implement These Soon
1. **Input Sanitization**: Prevent XSS attacks
2. **CSRF Protection**: Add CSRF tokens
3. **Request Logging**: Log all API requests
4. **Error Handling**: Don't expose stack traces
5. **Rate Limiting**: Per-endpoint limits
6. **File Validation**: Virus scanning for uploads

### Long-term Security
1. **Database Encryption**: Encrypt sensitive data
2. **API Versioning**: Version your API endpoints
3. **Audit Logging**: Log all user actions
4. **Backup Strategy**: Regular database backups
5. **Monitoring**: Set up security monitoring

---

## ✅ Production Readiness Checklist

### Critical (Must Fix)
- [x] JWT secret in environment variables
- [x] CORS configuration for production
- [x] Environment variables setup
- [x] Database migrations working

### Important (Should Fix)
- [ ] Input sanitization
- [ ] CSRF protection
- [ ] Request logging
- [ ] Error handling improvements

### Nice to Have
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] Performance optimization
- [ ] Security headers

**Status: READY FOR DEPLOYMENT** (with security fixes applied)

Remember: Always test in a staging environment before deploying to production!
