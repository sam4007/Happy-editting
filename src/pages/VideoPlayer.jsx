import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Star,
    Share2,
    Download,
    Settings,
    StickyNote,
    Clock,
    User,
    PlayCircle,
    List,
    Edit,
    Trash2,
    Save,
    X
} from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import CourseLayout from '../components/CourseLayout'
// Removed rich text editor import - keeping it simple

const VideoPlayer = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { videos, notes, favorites, toggleFavorite, addNote, updateNote, deleteNote, updateVideo, addToWatchHistory } = useVideo()
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [newNote, setNewNote] = useState('')
    const [activeTab, setActiveTab] = useState('course')
    const [editingNote, setEditingNote] = useState(null)
    const [editNoteContent, setEditNoteContent] = useState('')
    const [videoLoading, setVideoLoading] = useState(true)
    const [videoError, setVideoError] = useState(false)
    const [loadingTimeout, setLoadingTimeout] = useState(null)
    const iframeRef = useRef(null)

    const video = videos.find(v => v.id === parseInt(id))
    const videoNotes = notes[video?.id] || []
    const isFavorite = favorites.includes(video?.id)

    // Get course videos (same instructor and category)
    const courseVideos = videos.filter(v =>
        v.instructor === video?.instructor &&
        v.category === video?.category
    )

    // Reset state when video changes
    useEffect(() => {
        console.log('🎬 VideoPlayer: ID changed to:', id)
        setVideoLoading(true)
        setVideoError(false)
        setCurrentTime(0)
        setIsPlaying(false)
        setActiveTab('course')
        setInitializedVideoId(null) // Reset initialization state for new video

        // Clear any existing timeouts
        if (loadingTimeout) {
            clearTimeout(loadingTimeout)
        }

        // Cleanup function
        return () => {
            console.log('🧹 VideoPlayer: Cleaning up for ID:', id)
            if (loadingTimeout) {
                clearTimeout(loadingTimeout)
            }
        }
    }, [id]) // This effect runs when the video ID changes

    // Track if we've already initialized this video to prevent loops
    const [initializedVideoId, setInitializedVideoId] = useState(null)

    useEffect(() => {
        if (video && video.id !== initializedVideoId) {
            console.log('🎬 VideoPlayer: Loading video:', video.title)

            // Add to watch history when video is loaded (but don't update progress unnecessarily)
            addToWatchHistory(video.id)

            // Set duration from video data
            setDuration(video.duration)

            // Set current time to existing progress if available
            if (video.progress) {
                setCurrentTime((video.progress / 100) * video.duration)
            }

            // Debug: Log video info
            console.log('🎬 Playing video:', video.title)
            console.log('📺 Platform:', getVideoPlatform(video.url))
            console.log('🆔 Video ID:', extractVideoId(video.url))

            setVideoLoading(false)
            setInitializedVideoId(video.id) // Mark this video as initialized
        } else if (!video) {
            console.log('❌ VideoPlayer: Video not found for ID:', id)
            setVideoError(true)
            setVideoLoading(false)
            setInitializedVideoId(null)
        }
    }, [video?.id, id]) // Only depend on video.id and route id, not the full video object

    const handleAddNote = () => {
        console.log('Adding note:', newNote)
        if (newNote && newNote.trim() && video) {
            addNote(video.id, currentTime, newNote)
            setNewNote('')
        }
    }

    const handleEditNote = (note) => {
        setEditingNote(note.id)
        setEditNoteContent(note.note)
    }

    const handleSaveNote = () => {
        console.log('Saving note:', editNoteContent)
        if (editNoteContent && editNoteContent.trim() && video && editingNote) {
            updateNote(video.id, editingNote, { note: editNoteContent })
            setEditingNote(null)
            setEditNoteContent('')
        }
    }

    const handleCancelEdit = () => {
        setEditingNote(null)
        setEditNoteContent('')
    }

    const handleNoteClick = (timestamp) => {
        // Jump to the timestamp in the video
        setCurrentTime(timestamp)
        console.log(`Jumping to timestamp: ${formatTime(timestamp)}`)
    }

    const handleDeleteNote = (noteId) => {
        if (video && window.confirm('Are you sure you want to delete this note?')) {
            deleteNote(video.id, noteId)
        }
    }



    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Function to detect video platform
    const getVideoPlatform = (url) => {
        if (!url) return 'unknown'

        try {
            const urlObj = new URL(url)
            if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(urlObj.hostname)) {
                return 'youtube'
            } else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(urlObj.hostname)) {
                return 'vimeo'
            }
            return 'other'
        } catch {
            return 'unknown'
        }
    }

    // Function to get the original watch URL for fallback
    const getOriginalUrl = (video) => {
        if (video.source === 'youtube' && video.videoId) {
            return `https://www.youtube.com/watch?v=${video.videoId}`
        } else if (video.url && video.url.includes('player.vimeo.com')) {
            const vimeoMatch = video.url.match(/\/video\/(\d+)/)
            if (vimeoMatch) {
                return `https://vimeo.com/${vimeoMatch[1]}`
            }
        }
        return video.url || '#'
    }

    // Function to extract video ID from URL
    const extractVideoId = (url) => {
        if (!url) return null

        try {
            const urlObj = new URL(url)

            // Extract YouTube video ID
            if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(urlObj.hostname)) {
                if (urlObj.hostname === 'youtu.be') {
                    return urlObj.pathname.slice(1)
                } else if (urlObj.searchParams.has('v')) {
                    return urlObj.searchParams.get('v')
                } else if (urlObj.pathname.includes('/embed/')) {
                    const match = urlObj.pathname.match(/\/embed\/([^/?]+)/)
                    return match ? match[1] : null
                }
            }

            // Extract Vimeo video ID
            else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(urlObj.hostname)) {
                if (urlObj.hostname === 'player.vimeo.com') {
                    const match = urlObj.pathname.match(/\/video\/(\d+)/)
                    return match ? match[1] : null
                } else {
                    const match = urlObj.pathname.match(/\/(\d+)/)
                    return match ? match[1] : null
                }
            }

            return null
        } catch (error) {
            console.error('Error extracting video ID:', error)
            return null
        }
    }

    if (!video) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-transparent flex items-center justify-center">
                {/* Premium Fixed Black Background */}
                <div className="fixed inset-0 z-0">
                    {/* Pitch Black Background */}
                    <div className="absolute inset-0 bg-black"></div>

                    {/* Subtle Texture for Premium Feel */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `
                            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
                            radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
                        `,
                        backgroundSize: '30px 30px, 50px 50px'
                    }}></div>

                    {/* Light Mode Override */}
                    <div className="absolute inset-0 bg-white dark:bg-transparent"></div>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Video not found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The video you're looking for doesn't exist.
                    </p>
                    <button
                        onClick={() => navigate('/library')}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent">
            {/* Premium Fixed Black Background */}
            <div className="fixed inset-0 z-0">
                {/* Pitch Black Background */}
                <div className="absolute inset-0 bg-black"></div>

                {/* Subtle Texture for Premium Feel */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
                        radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
                    `,
                    backgroundSize: '30px 30px, 50px 50px'
                }}></div>

                {/* Light Mode Override */}
                <div className="absolute inset-0 bg-white dark:bg-transparent"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/library')}
                        className="flex items-center space-x-3 px-4 py-2 glass-card text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Library</span>
                    </button>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => toggleFavorite(video.id)}
                            className={`p-3 rounded-xl transition-all duration-300 ${isFavorite
                                ? 'text-yellow-500 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 shadow-lg'
                                : 'glass-card text-gray-600 dark:text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
                                }`}
                        >
                            <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>

                        <button className="p-3 rounded-xl glass-card text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300">
                            <Share2 className="w-5 h-5" />
                        </button>

                        <button className="p-3 rounded-xl glass-card text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300">
                            <Download className="w-5 h-5" />
                        </button>

                        <button className="p-3 rounded-xl glass-card text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Video Player */}
                    <div className="xl:col-span-2">
                        <div className="bg-black rounded-xl overflow-hidden mb-6">
                            <div className="aspect-video bg-gray-900 relative">
                                {video.url ? (
                                    <>
                                        {/* Platform-specific Video Player */}
                                        {getVideoPlatform(video.url) === 'youtube' ? (
                                            <div className="w-full h-full">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${extractVideoId(video.url)}?rel=0&modestbranding=1&autoplay=1`}
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                    title={video.title}
                                                />
                                            </div>
                                        ) : getVideoPlatform(video.url) === 'vimeo' ? (
                                            <div className="w-full h-full">
                                                <iframe
                                                    src={`https://player.vimeo.com/video/${extractVideoId(video.url)}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0`}
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                    title={video.title}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                                <PlayCircle className="w-16 h-16 text-blue-400 mb-4" />
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    {video.title}
                                                </h3>
                                                <p className="text-gray-300 text-sm mb-4">
                                                    Platform not supported for embedded playback
                                                </p>
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => window.open(video.url, '_blank')}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                                    >
                                                        Open in New Tab
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                        <PlayCircle className="w-16 h-16 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {video.title}
                                        </h3>
                                        <p className="text-gray-300 text-sm">
                                            Video content not available
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Info */}
                        <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {video.title}
                            </h1>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center space-x-2">
                                        <User className="w-5 h-5" />
                                        <span>{video.instructor}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-5 h-5" />
                                        <span>{video.duration}</span>
                                    </div>
                                </div>

                                {/* Favorite Button */}
                                <button
                                    onClick={() => toggleFavorite(video.id)}
                                    className={`p-2 rounded-lg transition-all duration-300 ${isFavorite
                                        ? 'text-yellow-500 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 shadow-lg'
                                        : 'glass-card text-gray-600 dark:text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
                                        }`}
                                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="xl:col-span-1">
                        <div className="glass-card-frosted">
                            {/* Tabs */}
                            <div className="relative p-3 mb-1">
                                {/* Background Glass Layer */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-white/2 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg"></div>

                                {/* Secondary Glass Layer */}
                                <div className="relative bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/8 p-1.5 shadow-inner">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setActiveTab('course')}
                                            className={`group relative flex-1 px-5 py-3 text-sm font-semibold transition-all duration-500 rounded-xl flex items-center justify-center overflow-hidden ${activeTab === 'course'
                                                ? 'text-gray-900 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {/* Active State Background */}
                                            {activeTab === 'course' && (
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/70 dark:from-white/25 dark:via-white/20 dark:to-white/15 backdrop-blur-xl border border-white/50 dark:border-white/20 rounded-xl shadow-xl transition-all duration-500"></div>
                                            )}

                                            {/* Hover Background */}
                                            <div className="absolute inset-0 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                                            {/* Content */}
                                            <div className="relative flex items-center justify-center">
                                                <List className={`w-4 h-4 mr-2.5 transition-all duration-300 ${activeTab === 'course'
                                                    ? 'text-primary-600 dark:text-primary-400 scale-110'
                                                    : 'group-hover:scale-105'
                                                    }`} />
                                                <span className="truncate tracking-wide">Course</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setActiveTab('notes')}
                                            className={`group relative flex-1 px-5 py-3 text-sm font-semibold transition-all duration-500 rounded-xl flex items-center justify-center overflow-hidden ${activeTab === 'notes'
                                                ? 'text-gray-900 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {/* Active State Background */}
                                            {activeTab === 'notes' && (
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/70 dark:from-white/25 dark:via-white/20 dark:to-white/15 backdrop-blur-xl border border-white/50 dark:border-white/20 rounded-xl shadow-xl transition-all duration-500"></div>
                                            )}

                                            {/* Hover Background */}
                                            <div className="absolute inset-0 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                                            {/* Content */}
                                            <div className="relative flex items-center justify-center">
                                                <StickyNote className={`w-4 h-4 mr-2.5 transition-all duration-300 ${activeTab === 'notes'
                                                    ? 'text-primary-600 dark:text-primary-400 scale-110'
                                                    : 'group-hover:scale-105'
                                                    }`} />
                                                <span className="truncate tracking-wide">Notes</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={`${activeTab === 'course' ? 'p-0' : 'p-4'}`}>
                                {activeTab === 'course' ? (
                                    <div className="max-h-[700px] overflow-y-auto course-scrollbar">
                                        <div className="p-4">
                                            {courseVideos.length > 0 ? (
                                                <CourseLayout
                                                    videos={courseVideos}
                                                    courseName={video?.playlistTitle || video?.category || "Course"}
                                                    instructor={video?.instructor}
                                                    compact={true}
                                                    currentVideoId={video?.id}
                                                />
                                            ) : (
                                                <div className="text-center py-8 glass-card m-4">
                                                    <List className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                        No Course Content
                                                    </h3>
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        This video is not part of a structured course.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Add Timestamped Note */}
                                        <div className="space-y-3 max-w-full">
                                            <textarea
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Add a timestamped note at current video position..."
                                                className="w-full p-4 glass-card text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none border-0 focus:ring-2 focus:ring-primary-500/50 transition-all duration-300 min-w-0"
                                                rows="4"
                                            />
                                            <button
                                                onClick={handleAddNote}
                                                disabled={!newNote || !newNote.trim()}
                                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Add Timestamped Note
                                            </button>
                                        </div>

                                        {/* Timestamped Notes List */}
                                        <div className="space-y-2 h-64 overflow-y-auto overflow-x-hidden modern-scrollbar">
                                            {videoNotes.map((note) => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => handleNoteClick(note.timestamp)}
                                                    className="p-2 glass-card hover:scale-[1.015] transition-all duration-300 cursor-pointer w-full"
                                                    title="Click to jump to this timestamp"
                                                >
                                                    <div className="flex items-start justify-between mb-1.5 gap-1">
                                                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
                                                            📍 {formatTime(note.timestamp)}
                                                        </span>
                                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-16">
                                                                {new Date(note.createdAt).toLocaleDateString()}
                                                                {note.updatedAt && ' (edited)'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleEditNote(note)
                                                                }}
                                                                className="p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                                                                title="Edit note"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteNote(note.id)
                                                                }}
                                                                className="p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                                                title="Delete note"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {editingNote === note.id ? (
                                                        <div className="space-y-2 w-full">
                                                            <textarea
                                                                value={editNoteContent}
                                                                onChange={(e) => setEditNoteContent(e.target.value)}
                                                                placeholder="Edit your note..."
                                                                className="w-full p-2 glass-card text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none border-0 focus:ring-2 focus:ring-primary-500/50 transition-all duration-300 min-w-0 text-sm"
                                                                rows="2"
                                                            />
                                                            <div className="flex flex-wrap gap-1">
                                                                <button
                                                                    onClick={handleSaveNote}
                                                                    className="flex items-center space-x-1 bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-700 dark:text-green-300 hover:bg-green-500/30 px-2 py-1 rounded text-xs font-medium transition-all duration-300"
                                                                >
                                                                    <Save className="w-3 h-3" />
                                                                    <span>Save</span>
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="flex items-center space-x-1 bg-gray-500/20 backdrop-blur-sm border border-gray-400/30 text-gray-700 dark:text-gray-300 hover:bg-gray-500/30 px-2 py-1 rounded text-xs font-medium transition-all duration-300"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                    <span>Cancel</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words overflow-hidden leading-relaxed">
                                                            {note.note}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {videoNotes.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full glass-card">
                                                    <StickyNote className="w-10 h-10 text-gray-400 mb-3" />
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-center text-sm">
                                                        No timestamped notes yet. Add your first note above!
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoPlayer 