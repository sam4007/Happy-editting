# Video Lecture Organizer - Happy Editing

A comprehensive React-based video lecture organization application with YouTube playlist integration, progress tracking, and premium UI features.

## 🚀 Features

- **YouTube Playlist Import**: Import real YouTube playlists using YouTube Data API v3
- **Progress Tracking**: Track learning progress with completion status and timestamps
- **Course Organization**: Organize videos by categories and instructors
- **Smart Dashboard**: Learning analytics, progress overview, and continue learning recommendations
- **Notes & Bookmarks**: Add timestamped notes and bookmarks for videos
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: All data persists locally in your browser

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **External API**: YouTube Data API v3
- **Icons**: Lucide React
- **Storage**: LocalStorage

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- YouTube Data API key (free from Google Cloud Console)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Happy-editting
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. (Optional) Restrict the API key to YouTube Data API v3 for security

### 4. Environment Configuration

Create a `.env` file in the project root:

```bash
# YouTube Data API Configuration
YOUTUBE_API_KEY=your_actual_api_key_here
```

**⚠️ Important Security Notes:**
- Never commit your API key to version control
- The `.env` file is already added to `.gitignore`
- Keep your API key secure and don't share it publicly

### 5. Start the Application

#### Option A: Start Both Frontend and Backend (Recommended)

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend development server
npm start
```

#### Option B: Individual Commands

```bash
# Backend only
npm run server

# Frontend only
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📚 Usage Guide

### Importing YouTube Playlists

1. **Open the Import Dialog**
   - Click the "+" button in the header
   - Select "YouTube Playlist" from the dropdown

2. **Enter Playlist URL**
   - Copy the YouTube playlist URL from your browser
   - Example: `https://www.youtube.com/playlist?list=PLrxfgDEc2NxY_fRjEJVHntkVhGP_Di6G`
   - Click "Fetch Playlist"

3. **Configure Course Details**
   - Review the fetched playlist information
   - Set course title and instructor name
   - Select or create a category
   - Click "Continue to Preview"

4. **Import Confirmation**
   - Review all videos to be imported
   - Click "Import X Videos" to complete

### Managing Your Learning

- **Dashboard**: View learning progress, statistics, and continue learning recommendations
- **Library**: Browse all imported videos, organized by categories
- **Video Player**: Watch videos with integrated notes, bookmarks, and course navigation
- **Progress Tracking**: Mark videos as complete and track overall progress

### Features in Video Player

- **Notes**: Add timestamped notes while watching
- **Bookmarks**: Save specific moments in videos
- **Course Navigation**: Browse through course content in sidebar
- **Progress Sync**: Automatic progress tracking

## 🔐 Security Features

### API Security
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Sanitized playlist IDs and URLs
- **Error Handling**: Comprehensive error messages without exposing sensitive data
- **Timeout Protection**: 60-second request timeout for large playlists

### Data Protection
- **Environment Variables**: API keys stored in `.env` file
- **Git Ignore**: Sensitive files excluded from version control
- **Local Storage**: All user data stored locally in browser

## 🚨 Troubleshooting

### Common Issues

#### 1. "Server not running" error
```bash
# Check if backend server is running
npm run server

# Verify server health
curl http://localhost:5000/api/health
```

#### 2. "API key not configured" error
- Ensure `.env` file exists with `YOUTUBE_API_KEY=your_key`
- Restart the server after adding/changing API key
- Verify API key is valid and has YouTube Data API v3 enabled

#### 3. "Playlist not found" error
- Ensure playlist is public or unlisted (not private)
- Check that URL contains `?list=` parameter
- Verify playlist still exists on YouTube

#### 4. "API quota exceeded" error
- YouTube Data API has daily quota limits
- Wait 24 hours for quota reset
- Consider upgrading quota in Google Cloud Console

### API Rate Limits
- **YouTube Data API**: 10,000 units per day (default)
- **Server Rate Limit**: 100 requests per minute per IP
- **Playlist Size**: Supports up to 1000 videos per playlist

## 🎯 API Endpoints

### Backend API Reference

#### Health Check
```
GET /api/health
Response: { status: "OK", hasApiKey: true, timestamp: "..." }
```

#### Extract Playlist ID
```
POST /api/extract-playlist-id
Body: { "url": "https://www.youtube.com/playlist?list=..." }
Response: { "playlistId": "PLrxfgDEc2NxY..." }
```

#### Get Playlist Data
```
GET /api/playlist/:playlistId
Response: {
  "playlistInfo": { ... },
  "videos": [ ... ]
}
```

## 📊 Data Structure

### Video Object
```json
{
  "id": "yt-playlist-index",
  "title": "Video Title",
  "description": "Video description",
  "duration": "10:30",
  "instructor": "Channel Name",
  "url": "https://www.youtube.com/watch?v=...",
  "videoId": "dQw4w9WgXcQ",
  "thumbnail": "https://i.ytimg.com/vi/.../maxresdefault.jpg",
  "publishedAt": "2023-01-01T00:00:00Z",
  "progress": 0,
  "completed": false,
  "category": "Video Editing",
  "source": "youtube-playlist"
}
```

## 🔄 Updates & Maintenance

### Updating Dependencies
```bash
npm update
```

### Backup Your Data
Data is stored in browser's localStorage. To backup:
1. Open Developer Tools (F12)
2. Go to Application > Storage > Local Storage
3. Export the data for backup

### API Key Management
- Regularly rotate API keys for security
- Monitor API usage in Google Cloud Console
- Set up billing alerts for API usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and support:
1. Check the troubleshooting section above
2. Verify your API key and server status
3. Check browser console for error messages
4. Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)

## 🎉 Acknowledgments

- YouTube Data API v3 for playlist data
- React and Vite for the development framework
- Tailwind CSS for styling
- Lucide React for icons

---

**Happy Learning! 🎓**