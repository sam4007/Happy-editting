// Configuration file for the application
const config = {
    // API Configuration
    API_BASE_URL: process.env.VITE_API_URL || 'https://lumiere-jndb.onrender.com',

    // YouTube API Configuration (for server-side use)
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,

    // Server Configuration
    PORT: process.env.PORT || 5000,

    // Development settings
    isDevelopment: process.env.NODE_ENV === 'development',

    // API Endpoints
    endpoints: {
        health: '/health',
        playlist: '/playlist',
        extractPlaylistId: '/extract-playlist-id'
    }
};

module.exports = config; 