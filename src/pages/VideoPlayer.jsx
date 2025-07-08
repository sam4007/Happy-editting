import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Star,
    Bookmark,
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
    const { videos, notes, bookmarks, favorites, toggleFavorite, addNote, addBookmark, updateNote, deleteNote, updateVideo, addToWatchHistory } = useVideo()
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [newNote, setNewNote] = useState('')
    const [newBookmark, setNewBookmark] = useState('')
    const [activeTab, setActiveTab] = useState('course')
    const [editingNote, setEditingNote] = useState(null)
    const [editNoteContent, setEditNoteContent] = useState('')
    const [videoLoading, setVideoLoading] = useState(true)
    const [videoError, setVideoError] = useState(false)
    const [loadingTimeout, setLoadingTimeout] = useState(null)
    const iframeRef = useRef(null)

    const video = videos.find(v => v.id === parseInt(id))
    const videoNotes = notes[video?.id] || []
    const videoBookmarks = bookmarks[video?.id] || []
    const isFavorite = favorites.includes(video?.id)

    // Get course videos (same instructor and category)
    const courseVideos = videos.filter(v =>
        v.instructor === video?.instructor &&
        v.category === video?.category
    )

    useEffect(() => {
        if (video) {
            // Add to watch history when video is loaded
            addToWatchHistory(video.id)
            // Set duration from video data
            setDuration(video.duration)
            // Update progress when component mounts
            const progress = Math.floor(Math.random() * 100) // Simulated progress
            updateVideo(video.id, { progress })

            // Debug: Log video info
            console.log('🎬 Playing video:', video.title)
            console.log('📺 Platform:', getVideoPlatform(video.url))
            console.log('🆔 Video ID:', extractVideoId(video.url))
        }
    }, [video, updateVideo, addToWatchHistory])

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

    const handleDeleteNote = (noteId) => {
        if (video && window.confirm('Are you sure you want to delete this note?')) {
            deleteNote(video.id, noteId)
        }
    }

    const handleAddBookmark = () => {
        if (newBookmark.trim() && video) {
            console.log('Adding bookmark from video player:', video.id, newBookmark)
            addBookmark(video.id, currentTime, newBookmark)
            setNewBookmark('')
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64 flex items-center justify-center">
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/library')}
                        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Library</span>
                    </button>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => toggleFavorite(video.id)}
                            className={`p-2 rounded-lg transition-colors ${isFavorite
                                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                }`}
                        >
                            <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>

                        <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>

                        <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Download className="w-5 h-5" />
                        </button>

                        <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Video Player */}
                    <div className="xl:col-span-1">
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {video.title}
                            </h1>

                            <div className="flex items-center space-x-6 mb-4 text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-2">
                                    <User className="w-5 h-5" />
                                    <span>{video.instructor}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{video.duration}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span>{video.rating}</span>
                                </div>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {video.description}
                            </p>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="xl:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setActiveTab('course')}
                                    className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'course'
                                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <List className="w-4 h-4 inline mr-1" />
                                    Course
                                </button>
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'notes'
                                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <StickyNote className="w-4 h-4 inline mr-1" />
                                    Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('bookmarks')}
                                    className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'bookmarks'
                                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Bookmark className="w-4 h-4 inline mr-1" />
                                    Bookmarks
                                </button>
                            </div>

                            <div className={`${activeTab === 'course' ? 'p-0' : 'p-4'}`}>
                                {activeTab === 'course' ? (
                                    <div className="max-h-[700px] overflow-y-auto course-scrollbar">
                                        <div className="p-4">
                                            {courseVideos.length > 0 ? (
                                                <CourseLayout
                                                    videos={courseVideos}
                                                    courseName={video?.instructor || "Course"}
                                                    compact={true}
                                                    currentVideoId={video?.id}
                                                />
                                            ) : (
                                                <div className="text-center py-8">
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
                                ) : activeTab === 'notes' ? (
                                    <div className="space-y-4">
                                        {/* Add Note */}
                                        <div className="space-y-2">
                                            <textarea
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Add a note at current timestamp..."
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                                                rows="4"
                                            />
                                            <button
                                                onClick={handleAddNote}
                                                disabled={!newNote || !newNote.trim()}
                                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                Add Note
                                            </button>
                                        </div>

                                        {/* Notes List */}
                                        <div className="space-y-3 max-h-96 overflow-y-auto modern-scrollbar">
                                            {videoNotes.map((note) => (
                                                <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                                            {formatTime(note.timestamp)}
                                                        </span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(note.createdAt).toLocaleDateString()}
                                                                {note.updatedAt && ' (edited)'}
                                                            </span>
                                                            <button
                                                                onClick={() => handleEditNote(note)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                title="Edit note"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                                title="Delete note"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {editingNote === note.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editNoteContent}
                                                                onChange={(e) => setEditNoteContent(e.target.value)}
                                                                placeholder="Edit your note..."
                                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                                                                rows="4"
                                                            />
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={handleSaveNote}
                                                                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                                                >
                                                                    <Save className="w-3 h-3" />
                                                                    <span>Save</span>
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                    <span>Cancel</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                            {note.note}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {videoNotes.length === 0 && (
                                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                    No notes yet. Add your first note above!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Add Bookmark */}
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newBookmark}
                                                onChange={(e) => setNewBookmark(e.target.value)}
                                                placeholder="Bookmark title..."
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                            />
                                            <button
                                                onClick={handleAddBookmark}
                                                disabled={!newBookmark.trim()}
                                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                Add Bookmark
                                            </button>
                                        </div>

                                        {/* Bookmarks List */}
                                        <div className="space-y-3 max-h-96 overflow-y-auto modern-scrollbar">
                                            {videoBookmarks.map((bookmark) => (
                                                <div key={bookmark.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                                            {formatTime(bookmark.timestamp)}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(bookmark.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {bookmark.title}
                                                    </p>
                                                </div>
                                            ))}
                                            {videoBookmarks.length === 0 && (
                                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                    No bookmarks yet. Add your first bookmark above!
                                                </p>
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