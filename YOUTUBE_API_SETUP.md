# YouTube API Integration Setup Guide

This guide will help you set up real YouTube API integration for importing playlists.

## Prerequisites

- Node.js installed on your system
- A Google account
- Basic knowledge of environment variables

## Step 1: Get YouTube Data API Key

### 1.1 Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Create Project" or select an existing project
3. Enter a project name (e.g., "YouTube Video Organizer")
4. Click "Create"

### 1.2 Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on the API and click **"Enable"**

### 1.3 Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key
4. (Optional) Click **"Restrict Key"** to add restrictions:
   - **API restrictions**: Select "YouTube Data API v3"
   - **Application restrictions**: Choose based on your needs (None for development)

## Step 2: Configure Your Application

### 2.1 Create Environment File

Create a `.env` file in your project root directory:

```bash
# YouTube Data API Configuration
YOUTUBE_API_KEY=your_api_key_here

# Server Configuration
PORT=5000

# Development URLs
VITE_API_URL=http://localhost:5000/api
```

Replace `your_api_key_here` with your actual API key from Step 1.3.

### 2.2 Install Dependencies

If you haven't already installed the dependencies:

```bash
npm install
```

## Step 3: Run the Application

### 3.1 Start the Backend Server

In your terminal, run:

```bash
npm run server
```

You should see:
```
🚀 YouTube API Server running on port 5000
📡 API Health: http://localhost:5000/api/health
🔑 API Key configured: true
```

### 3.2 Start the Frontend (in a new terminal)

```bash
npm run dev
```

### 3.3 Run Both Simultaneously

Or run both with one command:

```bash
npm run dev-all
```

## Step 4: Test the Integration

1. Open your browser and go to `http://localhost:3000`
2. Go to Library → Import Playlist
3. You should see "Server Connected" status
4. Try importing a public YouTube playlist

## API Usage Limits

### Free Tier Limits
- **10,000 quota units per day** (resets at midnight Pacific Time)
- **100 quota units per 100 seconds per user**

### Common Operations Cost
- **Playlist details**: ~5 quota units
- **Playlist items** (50 videos): ~5 quota units
- **Video details** (50 videos): ~5 quota units

**Total cost per playlist**: ~15 quota units (for 50 videos)

This means you can import approximately **650 playlists per day** on the free tier.

## Troubleshooting

### Common Issues

#### 1. "Server not running" Error
- Make sure the backend server is running (`npm run server`)
- Check if port 5000 is available
- Verify the API_BASE_URL in the frontend matches your server port

#### 2. "YouTube API key not configured" Error
- Ensure your `.env` file exists and contains `YOUTUBE_API_KEY`
- Restart the server after adding the API key
- Check for typos in the environment variable name

#### 3. "API quota exceeded" Error
- You've hit the daily quota limit (10,000 units)
- Wait until midnight Pacific Time for quota reset
- Consider applying for quota increase if needed

#### 4. "Playlist not found" Error
- Verify the playlist URL is correct
- Ensure the playlist is public or unlisted (not private)
- Check if the playlist ID is extracted correctly

#### 5. CORS Errors
- The backend server handles CORS automatically
- If you still get CORS errors, ensure you're using the backend API endpoints

### Debug Steps

1. **Check Server Health**:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Test API Key**:
   ```bash
   curl "http://localhost:5000/api/playlist/PLrxfgDEc2NxY_fRjEJVHntkVhGP_Di6G"
   ```

3. **Check Environment Variables**:
   ```bash
   node -e "console.log(process.env.YOUTUBE_API_KEY)"
   ```

## Security Best Practices

1. **Never commit your API key to version control**
2. **Add `.env` to your `.gitignore` file**
3. **Use API key restrictions in Google Cloud Console**
4. **Consider using Application Default Credentials for production**

## Rate Limiting

The application automatically handles:
- Pagination for large playlists
- Error handling for quota exceeded
- Retry logic for temporary failures

## Production Deployment

For production deployment:

1. **Set environment variables** on your hosting platform
2. **Use HTTPS** for all API calls
3. **Implement proper error logging**
4. **Consider using a database** for caching results
5. **Set up monitoring** for API quota usage

## API Endpoints

The backend provides these endpoints:

- `GET /api/health` - Server health check
- `GET /api/playlist/:playlistId` - Get playlist data
- `POST /api/extract-playlist-id` - Extract playlist ID from URL

## Example Usage

```javascript
// Get playlist data
const response = await fetch('http://localhost:5000/api/playlist/PLrxfgDEc2NxY_fRjEJVHntkVhGP_Di6G');
const data = await response.json();

console.log(data.playlistInfo.title); // Playlist title
console.log(data.videos.length); // Number of videos
```

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check the server logs for backend errors
3. Verify your API key is working in Google Cloud Console
4. Ensure all dependencies are installed correctly

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://developers.google.com/youtube/v3/guides/auth/api-keys)

---

**Note**: This setup enables real YouTube playlist importing with actual video data, titles, descriptions, and durations. The free tier should be sufficient for most personal use cases. 