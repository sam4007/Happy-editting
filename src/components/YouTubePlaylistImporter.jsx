import React, { useState, useEffect } from 'react'
import { Plus, X, Youtube, Link, Tag, Clock, User, AlertCircle, CheckCircle, Play, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const YouTubePlaylistImporter = ({ onImport, onClose, categories = [], addCategory }) => {
    const [step, setStep] = useState(1) // 1: URL input, 2: Category & Title, 3: Preview & Import
    const [playlistUrl, setPlaylistUrl] = useState('')
    const [playlistId, setPlaylistId] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newCategory, setNewCategory] = useState('')
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
    const [courseTitle, setCourseTitle] = useState('')
    const [instructor, setInstructor] = useState('')
    const [fetchedVideos, setFetchedVideos] = useState([])
    const [playlistInfo, setPlaylistInfo] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState('')
    const [serverStatus, setServerStatus] = useState(null)
    const [retryCount, setRetryCount] = useState(0)
    const [fetchProgress, setFetchProgress] = useState('')

    const API_BASE_URL = 'http://localhost:5000/api'
    const MAX_RETRIES = 3

    // Check server status on component mount
    useEffect(() => {
        checkServerStatus()
    }, [])

    // Check server status
    const checkServerStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`)
            const data = await response.json()
            setServerStatus(data)
            return data
        } catch (error) {
            console.error('Server not available:', error)
            setServerStatus({ status: 'ERROR', message: 'Server not running', hasApiKey: false })
            return null
        }
    }

    // Extract playlist ID from YouTube URL
    const extractPlaylistId = (url) => {
        const regex = /[?&]list=([^#&?]*)/
        const match = url.match(regex)
        return match ? match[1] : null
    }

    // Fetch real playlist data from YouTube API with retry logic
    const fetchRealPlaylistData = async (playlistId, attempt = 1) => {
        try {
            setFetchProgress(`Fetching playlist data... (Attempt ${attempt}/${MAX_RETRIES})`)

            const response = await fetch(`${API_BASE_URL}/playlist/${playlistId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout for long requests
                signal: AbortSignal.timeout(60000) // 60 second timeout
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`)
            }

            setFetchProgress('')
            return data
        } catch (error) {
            console.error(`Error fetching playlist (attempt ${attempt}):`, error)

            if (attempt < MAX_RETRIES && !error.name?.includes('AbortError')) {
                // Retry with exponential backoff
                const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
                setFetchProgress(`Retrying in ${delay / 1000} seconds...`)

                await new Promise(resolve => setTimeout(resolve, delay))
                return fetchRealPlaylistData(playlistId, attempt + 1)
            }

            throw error
        }
    }

    // Handle URL input and fetch playlist
    const handleFetchPlaylist = async () => {
        setError('')
        setIsLoading(true)
        setRetryCount(0)
        setFetchProgress('')

        // First check if server is running
        const serverStatus = await checkServerStatus()
        if (!serverStatus || serverStatus.status === 'ERROR') {
            setError('Backend server is not running. Please start the server with "npm run server"')
            setIsLoading(false)
            return
        }

        if (!serverStatus.hasApiKey) {
            setError('YouTube API key is not configured or invalid. Please check your .env file and restart the server.')
            setIsLoading(false)
            return
        }

        if (!playlistUrl.trim()) {
            setError('Please enter a YouTube playlist URL')
            setIsLoading(false)
            return
        }

        const id = extractPlaylistId(playlistUrl)
        if (!id) {
            setError('Invalid YouTube playlist URL. Please check the URL and try again.')
            setIsLoading(false)
            return
        }

        try {
            setPlaylistId(id)
            setFetchProgress('Connecting to YouTube API...')

            // Fetch real playlist data from YouTube API
            const result = await fetchRealPlaylistData(id)

            setFetchedVideos(result.videos)
            setPlaylistInfo(result.playlistInfo)

            // Set default course title and instructor from real data
            setCourseTitle(result.playlistInfo.title)
            setInstructor(result.playlistInfo.channelTitle)

            setStep(2)
        } catch (err) {
            console.error('Fetch error:', err)

            if (err.name?.includes('AbortError')) {
                setError('Request timed out. The playlist may be very large or the server is overloaded. Please try again.')
            } else if (err.message.includes('quota')) {
                setError('YouTube API quota exceeded. Please try again tomorrow or upgrade your quota limits.')
            } else if (err.message.includes('not found') || err.message.includes('404')) {
                setError('Playlist not found. Please check if the playlist is public and the URL is correct.')
            } else if (err.message.includes('private') || err.message.includes('403')) {
                setError('This playlist is private or access is restricted. Please make sure the playlist is public or unlisted.')
            } else if (err.message.includes('Rate limit')) {
                setError('Too many requests. Please wait a moment and try again.')
            } else if (err.message.includes('timeout') || err.message.includes('408')) {
                setError('Request timed out. Please try again with a smaller playlist.')
            } else {
                setError(`Failed to fetch playlist: ${err.message || 'Unknown error occurred'}`)
            }
        } finally {
            setIsLoading(false)
            setFetchProgress('')
        }
    }

    // Handle category selection and course details
    const handleContinueToPreview = () => {
        setError('')

        if (!selectedCategory) {
            setError('Please select or create a category')
            return
        }

        if (!courseTitle.trim()) {
            setError('Please enter a course title')
            return
        }

        setStep(3)
    }

    // Add new category
    const handleAddNewCategory = () => {
        setError('')

        if (!newCategory.trim()) {
            setError('Please enter a category name')
            return
        }

        if (categories.includes(newCategory.trim())) {
            setError('Category already exists')
            return
        }

        if (addCategory) {
            const success = addCategory(newCategory.trim())
            if (success) {
                setSelectedCategory(newCategory.trim())
                setShowNewCategoryInput(false)
                setNewCategory('')
            } else {
                setError('Failed to add category. Please try again.')
            }
        } else {
            setError('Unable to add category. Please try again.')
        }
    }

    // Handle final import
    const handleImport = async () => {
        setIsImporting(true)
        setError('')

        try {
            // Simulate import delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            const playlistData = {
                playlistId,
                playlistTitle: courseTitle.trim(),
                category: selectedCategory,
                instructor: instructor.trim() || 'Unknown Creator',
                videos: fetchedVideos.map(video => ({
                    ...video,
                    category: selectedCategory,
                    instructor: instructor.trim() || 'Unknown Creator',
                    source: 'youtube',
                    playlistTitle: courseTitle.trim(),
                    playlistId: playlistId,
                    originalUrl: playlistUrl,
                    importDate: new Date().toISOString(),
                    importedBy: 'YouTubeAPI'
                })),
                importDate: new Date().toISOString(),
                originalUrl: playlistUrl,
                playlistInfo: playlistInfo,
                isReal: true, // Flag to indicate this is real YouTube data
                importedBy: 'YouTubeAPI'
            }

            onImport(playlistData)
            onClose()
        } catch (err) {
            setError('Failed to import playlist. Please try again.')
        } finally {
            setIsImporting(false)
        }
    }

    // Retry server connection
    const retryServerConnection = async () => {
        setError('')
        await checkServerStatus()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <Youtube className="h-6 w-6 text-red-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Import YouTube Playlist
                        </h2>
                        {serverStatus && (
                            <div className="flex items-center space-x-2">
                                {serverStatus.status === 'OK' && serverStatus.hasApiKey ? (
                                    <div className="flex items-center space-x-1 text-green-600">
                                        <Wifi className="h-4 w-4" />
                                        <span className="text-xs">Connected & Ready</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-1 text-red-600">
                                        <WifiOff className="h-4 w-4" />
                                        <span className="text-xs">
                                            {serverStatus.status === 'ERROR' ? 'Server Offline' : 'API Key Missing'}
                                        </span>
                                        <button
                                            onClick={retryServerConnection}
                                            className="ml-1 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                            title="Retry connection"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Server Status Notice */}
                {serverStatus && serverStatus.status === 'OK' && serverStatus.hasApiKey && (
                    <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="text-green-800 dark:text-green-200 font-medium mb-1">
                                    YouTube API Integration Active
                                </p>
                                <p className="text-green-700 dark:text-green-300">
                                    Server is running with valid API key. Ready to import real playlist data with actual video information.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNum
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                                        }`}
                                >
                                    {stepNum}
                                </div>
                                {stepNum < 3 && (
                                    <div
                                        className={`w-16 h-0.5 ml-2 ${step > stepNum
                                            ? 'bg-blue-600'
                                            : 'bg-gray-200 dark:bg-gray-600'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                        <span>Fetch Playlist</span>
                        <span>Course Details</span>
                        <span>Import Preview</span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <span className="text-red-700 dark:text-red-300">{error}</span>
                        </div>
                    </div>
                )}

                {/* Fetch Progress */}
                {fetchProgress && (
                    <div className="mx-6 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                            <span className="text-blue-700 dark:text-blue-300 text-sm">{fetchProgress}</span>
                        </div>
                    </div>
                )}

                {/* Step 1: URL Input and Fetch */}
                {step === 1 && (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    YouTube Playlist URL
                                </label>
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <input
                                            type="url"
                                            value={playlistUrl}
                                            onChange={(e) => setPlaylistUrl(e.target.value)}
                                            placeholder="https://www.youtube.com/playlist?list=..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            disabled={isLoading}
                                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleFetchPlaylist()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleFetchPlaylist}
                                        disabled={isLoading || !serverStatus?.hasApiKey}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <Link className="h-4 w-4" />
                                        )}
                                        <span>{isLoading ? 'Fetching...' : 'Fetch Playlist'}</span>
                                    </button>
                                </div>
                            </div>

                            {isLoading && (
                                <div className="text-center py-8">
                                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Fetching real playlist data from YouTube API...
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                        This may take a moment for large playlists. Please be patient.
                                    </p>
                                    {fetchProgress && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            {fetchProgress}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                                    How to get a YouTube playlist URL:
                                </h3>
                                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                                    <li>1. Go to YouTube and find the playlist you want to import</li>
                                    <li>2. Click on the playlist to open it</li>
                                    <li>3. Copy the URL from your browser's address bar</li>
                                    <li>4. Paste it above and click "Fetch Playlist"</li>
                                </ol>
                                <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded text-xs text-blue-700 dark:text-blue-300">
                                    <strong>Example URL:</strong> https://www.youtube.com/playlist?list=PLrxfgDEc2NxY_fRjEJVHntkVhGP_Di6G
                                    <br />
                                    <strong>Note:</strong> Only public and unlisted playlists can be imported.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Category & Course Details */}
                {step === 2 && (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                    <span className="text-green-700 dark:text-green-300 font-medium">
                                        Successfully fetched {fetchedVideos.length} videos from "{playlistInfo?.title}"!
                                    </span>
                                </div>
                                {playlistInfo && (
                                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 space-y-1">
                                        <div>Channel: {playlistInfo.channelTitle} • Total Duration: {playlistInfo.totalDuration}</div>
                                        <div>Privacy: {playlistInfo.privacyStatus} • Created: {new Date(playlistInfo.publishedAt).toLocaleDateString()}</div>
                                    </div>
                                )}
                            </div>

                            {/* Course Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Course Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Course Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={courseTitle}
                                            onChange={(e) => setCourseTitle(e.target.value)}
                                            placeholder="Enter course title"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Instructor/Creator
                                        </label>
                                        <input
                                            type="text"
                                            value={instructor}
                                            onChange={(e) => setInstructor(e.target.value)}
                                            placeholder="Enter instructor name"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Select Category *
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`p-3 text-left border rounded-lg transition-colors ${selectedCategory === category
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Tag className="h-4 w-4 text-gray-500 mb-1" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {category}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setShowNewCategoryInput(true)}
                                        className="flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Create New Category
                                        </span>
                                    </button>
                                </div>

                                {showNewCategoryInput && (
                                    <div className="mt-3 flex space-x-3">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="Enter new category name"
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                                        />
                                        <button
                                            onClick={handleAddNewCategory}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowNewCategoryInput(false)
                                                setNewCategory('')
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Preview & Import */}
                {step === 3 && (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Import Preview
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Course Title:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{courseTitle}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Category:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedCategory}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Instructor:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{instructor}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Videos:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{fetchedVideos.length} videos</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                        Original URL: {playlistUrl}
                                        <br />
                                        Total Duration: {playlistInfo?.totalDuration} • Privacy: {playlistInfo?.privacyStatus}
                                    </div>
                                </div>
                            </div>

                            {/* Video List Preview */}
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                                    Videos to Import ({fetchedVideos.length})
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                                    {fetchedVideos.slice(0, 5).map((video, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <Youtube className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {video.title}
                                                    </h4>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span className="flex items-center space-x-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{video.duration}</span>
                                                        </span>
                                                        <span className="flex items-center space-x-1">
                                                            <User className="h-3 w-3" />
                                                            <span>{video.instructor}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {fetchedVideos.length > 5 && (
                                        <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            ... and {fetchedVideos.length - 5} more videos
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>Ready to import:</strong> This will import real YouTube playlist data including
                                    actual video titles, descriptions, durations, and channel information from the YouTube Data API.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        {step > 1 && !isLoading && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {step === 2 && (
                            <button
                                onClick={handleContinueToPreview}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Continue to Preview
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                onClick={handleImport}
                                disabled={isImporting}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                {isImporting ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                <span>
                                    {isImporting ? 'Importing...' : `Import ${fetchedVideos.length} Videos`}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default YouTubePlaylistImporter 