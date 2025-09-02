# AI Nudity Detection Setup Guide

## Overview
Your Grave Grounds Faction Tracker now includes AI-powered nudity detection using NSFW.js, a free and open-source library that can detect inappropriate content in images.

## Installation

1. **Install the new dependencies:**
   ```bash
   npm install
   ```

2. **Start your server:**
   ```bash
   npm start
   ```

The NSFW.js model will automatically download and load when the server starts. You'll see a message in the console: "NSFW.js model loaded successfully"

## How It Works

### Automatic Detection
- **Avatar Uploads**: All avatar images are automatically checked before being saved
- **Gallery Uploads**: All character images are automatically checked before being added to the gallery
- **Real-time Processing**: Images are analyzed using AI to detect inappropriate content

### Detection Categories
The system detects these types of inappropriate content:
- **Porn**: Explicit sexual content
- **Sexy**: Suggestive or revealing content
- **Hentai**: Anime/manga sexual content

### Confidence Threshold
- Images are flagged if they contain inappropriate content with >50% confidence
- You can adjust this threshold in the `checkImageForNudity` function

## User Experience

### For Safe Images
- Images pass through normally
- Users see standard success messages
- No indication that content checking occurred

### For Inappropriate Images
- Upload is rejected immediately
- User receives clear error message:
  ```
  "Avatar rejected: Inappropriate content detected"
  "Character image rejected: Inappropriate content detected"
  ```
- File is automatically deleted from server
- Detailed reason provided (e.g., "Detected Porn content with 85.2% confidence")

## Admin Features

### Content Moderation Check
Visit `/api/maintenance/content-check` to scan all existing images:
- Checks all gallery items for inappropriate content
- Provides detailed report of flagged items
- Useful for auditing existing content

### File Maintenance
Visit `/api/maintenance/files` to check for:
- Missing image files
- Orphaned files in uploads directory
- General file system health

## Configuration Options

### Adjusting Sensitivity
In `server.js`, modify the `confidenceThreshold` in the `checkImageForNudity` function:
```javascript
const confidenceThreshold = 0.5; // 50% confidence (current setting)
// Lower = more sensitive (0.3 = 30%)
// Higher = less sensitive (0.7 = 70%)
```

### Model Loading
The NSFW.js model loads automatically on server start. If it fails to load:
- Check your internet connection (model downloads from GitHub)
- Restart the server
- Check console for error messages

## Privacy & Performance

### Privacy
- All processing happens on your server
- No images are sent to external services
- No data is stored or logged beyond standard server logs

### Performance
- Model loads once at startup (~25MB download)
- Each image check takes 1-3 seconds
- Images are resized to 224x224 for processing
- Original files are preserved after checking

## Troubleshooting

### Model Not Loading
```
Failed to load NSFW.js model: [error]
```
- Ensure internet connection
- Check if GitHub is accessible
- Restart server

### Detection Errors
```
Error during nudity detection: [error]
```
- Check if image file exists
- Verify image format is supported
- Check server logs for details

### False Positives
If legitimate images are being flagged:
- Increase the `confidenceThreshold` (e.g., from 0.5 to 0.7)
- Review flagged content manually
- Consider the context of your application

## Testing

To test the system:

1. **Start the server** and wait for "NSFW.js model loaded successfully"

2. **Try uploading a safe image** - should work normally

3. **Check existing content** by visiting:
   ```
   http://localhost:8080/api/maintenance/content-check
   ```

4. **Monitor server logs** for detection results

## Support

The implementation uses:
- **NSFW.js**: Free, open-source nudity detection
- **Sharp**: Image processing library
- **No external APIs**: Everything runs locally

This solution respects your preference for avoiding paid services while providing robust content moderation.
