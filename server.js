const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

const rateLimit = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(clientIP)) {
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const clientData = rateLimitMap.get(clientIP);

    if (now > clientData.resetTime) {
        // Reset the window
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }

    clientData.count++;
    next();
};

app.use(rateLimit);

// YouTube Data API configuration with validation
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Validate API key format (basic validation)
const isValidApiKey = (key) => {
    if (!key) return false;
    // YouTube API keys are typically 39 characters long and contain letters, numbers, hyphens, and underscores
    const apiKeyRegex = /^[A-Za-z0-9_-]{35,45}$/;
    return apiKeyRegex.test(key) && key !== 'your_api_key_here';
};

// Input sanitization
const sanitizePlaylistId = (playlistId) => {
    if (!playlistId || typeof playlistId !== 'string') return null;
    // YouTube playlist IDs are typically 34 characters long
    const sanitized = playlistId.replace(/[^a-zA-Z0-9_-]/g, '');
    return sanitized.length >= 10 && sanitized.length <= 50 ? sanitized : null;
};

const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
        const urlObj = new URL(url);
        if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(urlObj.hostname)) {
            return null;
        }
        return url;
    } catch {
        return null;
    }
};

// Helper function to extract playlist ID from URL
const extractPlaylistId = (url) => {
    if (!url) return null;
    const regex = /[?&]list=([^#&?]*)/;
    const match = url.match(regex);
    return match ? sanitizePlaylistId(match[1]) : null;
};

// Helper function to format duration from ISO 8601 to readable format
const formatDuration = (isoDuration) => {
    if (!isoDuration) return '0:00';

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
};

// Helper function to get video details for durations with error handling
const getVideoDetails = async (videoIds) => {
    if (!videoIds || videoIds.length === 0) return {};

    try {
        // Split into chunks of 50 (YouTube API limit)
        const chunks = [];
        for (let i = 0; i < videoIds.length; i += 50) {
            chunks.push(videoIds.slice(i, i + 50));
        }

        const allVideoDetails = {};

        for (const chunk of chunks) {
            const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
                params: {
                    key: YOUTUBE_API_KEY,
                    part: 'contentDetails,snippet',
                    id: chunk.join(',')
                },
                timeout: 10000 // 10 second timeout
            });

            response.data.items.forEach(item => {
                allVideoDetails[item.id] = {
                    duration: formatDuration(item.contentDetails.duration),
                    title: item.snippet?.title || 'Untitled Video',
                    publishedAt: item.snippet?.publishedAt
                };
            });
        }

        return allVideoDetails;
    } catch (error) {
        console.error('Error fetching video details:', error.response?.data || error.message);
        return {};
    }
};

// API Routes

// Health check endpoint with enhanced information
app.get('/api/health', (req, res) => {
    const hasValidKey = isValidApiKey(YOUTUBE_API_KEY);
    res.json({
        status: 'OK',
        message: 'YouTube API Server is running',
        hasApiKey: hasValidKey,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get playlist information with enhanced security and error handling
app.get('/api/playlist/:playlistId', async (req, res) => {
    const { playlistId } = req.params;

    // Validate API key
    if (!isValidApiKey(YOUTUBE_API_KEY)) {
        return res.status(500).json({
            error: 'Invalid API configuration',
            message: 'YouTube API key is not properly configured. Please check your .env file.'
        });
    }

    // Sanitize playlist ID
    const cleanPlaylistId = sanitizePlaylistId(playlistId);
    if (!cleanPlaylistId) {
        return res.status(400).json({
            error: 'Invalid playlist ID',
            message: 'Please provide a valid YouTube playlist ID'
        });
    }

    try {
        console.log(`📥 Fetching playlist: ${cleanPlaylistId}`);

        // Fetch playlist details
        const playlistResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlists`, {
            params: {
                key: YOUTUBE_API_KEY,
                part: 'snippet,contentDetails,status',
                id: cleanPlaylistId
            },
            timeout: 15000 // 15 second timeout
        });

        if (playlistResponse.data.items.length === 0) {
            return res.status(404).json({
                error: 'Playlist not found',
                message: 'The playlist ID provided does not exist, is private, or has been deleted'
            });
        }

        const playlist = playlistResponse.data.items[0];

        // Check if playlist is accessible
        if (playlist.status?.privacyStatus === 'private') {
            return res.status(403).json({
                error: 'Private playlist',
                message: 'This playlist is private and cannot be accessed'
            });
        }

        console.log(`📋 Playlist "${playlist.snippet.title}" found with ${playlist.contentDetails.itemCount} items`);

        // Fetch playlist items (videos) with pagination
        let allVideos = [];
        let nextPageToken = null;
        let fetchCount = 0;
        const maxPages = 20; // Limit to prevent abuse

        do {
            if (fetchCount >= maxPages) {
                console.log(`⚠️ Reached maximum page limit for playlist ${cleanPlaylistId}`);
                break;
            }

            const itemsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
                params: {
                    key: YOUTUBE_API_KEY,
                    part: 'snippet,contentDetails,status',
                    playlistId: cleanPlaylistId,
                    maxResults: 50,
                    pageToken: nextPageToken
                },
                timeout: 15000
            });

            // Filter out deleted or private videos
            const validItems = itemsResponse.data.items.filter(item => {
                return item.snippet.resourceId.kind === 'youtube#video' &&
                    item.snippet.title !== 'Private video' &&
                    item.snippet.title !== 'Deleted video';
            });

            allVideos = allVideos.concat(validItems);
            nextPageToken = itemsResponse.data.nextPageToken;
            fetchCount++;

            console.log(`📹 Fetched ${validItems.length} videos (page ${fetchCount})`);

        } while (nextPageToken && fetchCount < maxPages);

        if (allVideos.length === 0) {
            return res.status(404).json({
                error: 'No accessible videos',
                message: 'This playlist contains no public videos'
            });
        }

        // Get video IDs for fetching durations
        const videoIds = allVideos.map(item => item.snippet.resourceId.videoId);

        console.log(`🔍 Fetching details for ${videoIds.length} videos`);

        // Fetch video details for durations and additional info
        const videoDetails = await getVideoDetails(videoIds);

        // Process and format video data
        const videos = allVideos.map((item, index) => {
            const videoId = item.snippet.resourceId.videoId;
            const details = videoDetails[videoId] || {};

            return {
                id: `yt-${cleanPlaylistId}-${index}`,
                title: details.title || item.snippet.title,
                description: item.snippet.description || '',
                duration: details.duration || '0:00',
                instructor: item.snippet.videoOwnerChannelTitle || playlist.snippet.channelTitle,
                url: `https://www.youtube.com/embed/${videoId}`,
                videoId: videoId,
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
                publishedAt: item.snippet.publishedAt || details.publishedAt,
                position: item.snippet.position || index,
                progress: 0,
                completed: false,
                dateAdded: new Date().toISOString(),
                source: 'youtube-playlist',
                originalIndex: index + 1
            };
        });

        // Calculate total duration
        const totalMinutes = videos.reduce((total, video) => {
            if (video.duration === '0:00') return total;
            const parts = video.duration.split(':').map(Number);
            if (parts.length === 2) {
                return total + parts[0] + (parts[1] / 60);
            } else if (parts.length === 3) {
                return total + (parts[0] * 60) + parts[1] + (parts[2] / 60);
            }
            return total;
        }, 0);

        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = Math.floor(totalMinutes % 60);
        const totalDuration = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

        const result = {
            playlistInfo: {
                id: cleanPlaylistId,
                title: playlist.snippet.title,
                description: playlist.snippet.description || '',
                channelTitle: playlist.snippet.channelTitle,
                channelId: playlist.snippet.channelId,
                videoCount: videos.length,
                totalDuration: totalDuration,
                publishedAt: playlist.snippet.publishedAt,
                thumbnails: playlist.snippet.thumbnails,
                url: `https://www.youtube.com/playlist?list=${cleanPlaylistId}`,
                privacyStatus: playlist.status?.privacyStatus || 'public'
            },
            videos: videos
        };

        console.log(`✅ Successfully processed playlist "${playlist.snippet.title}" with ${videos.length} videos`);
        res.json(result);

    } catch (error) {
        console.error('❌ Error fetching playlist:', error.response?.data || error.message);

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                error: 'Request timeout',
                message: 'The request took too long to complete. Please try again.'
            });
        }

        if (error.response?.status === 403) {
            const errorMessage = error.response.data?.error?.message || '';
            if (errorMessage.includes('quota')) {
                return res.status(403).json({
                    error: 'API quota exceeded',
                    message: 'YouTube API quota limit reached. Please try again tomorrow or upgrade your quota.'
                });
            }
            return res.status(403).json({
                error: 'Access forbidden',
                message: 'Invalid API key or insufficient permissions'
            });
        }

        if (error.response?.status === 404) {
            return res.status(404).json({
                error: 'Playlist not found',
                message: 'The playlist may be private, deleted, or the ID is incorrect'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch playlist',
            message: 'An unexpected error occurred while fetching the playlist'
        });
    }
});

// Extract playlist ID from URL with enhanced validation
app.post('/api/extract-playlist-id', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            error: 'URL is required',
            message: 'Please provide a YouTube playlist URL'
        });
    }

    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
        return res.status(400).json({
            error: 'Invalid YouTube URL',
            message: 'Please provide a valid YouTube URL'
        });
    }

    const playlistId = extractPlaylistId(sanitizedUrl);

    if (!playlistId) {
        return res.status(400).json({
            error: 'Invalid YouTube playlist URL',
            message: 'Please provide a valid YouTube playlist URL containing a list parameter'
        });
    }

    res.json({ playlistId });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The route ${req.originalUrl} does not exist`
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 YouTube API Server running on port ${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health`);

    const hasValidKey = isValidApiKey(YOUTUBE_API_KEY);
    console.log(`🔑 API Key configured: ${hasValidKey}`);

    if (!hasValidKey) {
        console.log('⚠️  WARNING: YouTube API key not found or invalid!');
        console.log('   Please set a valid YOUTUBE_API_KEY in your .env file');
        console.log('   Get your key from: https://console.cloud.google.com/apis/credentials');
    } else {
        console.log('✅ Ready to import YouTube playlists!');
    }
});

module.exports = app; 