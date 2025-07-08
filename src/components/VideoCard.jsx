import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Clock, User, Star, MoreVertical, Bookmark, CheckCircle, Heart, Trash2, AlertTriangle, X } from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'

const VideoCard = ({ video, variant = 'default' }) => {
    const navigate = useNavigate()
    const { favorites, toggleFavorite, addToWatchHistory, addBookmark, bookmarks, deleteVideo } = useVideo()
    const [bookmarkAdded, setBookmarkAdded] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const isFavorite = favorites.includes(video.id)
    const isCompleted = video.completed
    const progressPercentage = video.progress || 0
    const hasBookmarks = bookmarks[video.id] && bookmarks[video.id].length > 0

    const handlePlay = () => {
        addToWatchHistory(video.id)
        navigate(`/video/${video.id}`)
    }

    const handleFavoriteToggle = (e) => {
        e.stopPropagation()
        console.log('Toggling favorite for video:', video.id)
        toggleFavorite(video.id)
    }

    const handleBookmark = (e) => {
        e.stopPropagation()
        console.log('📌 VideoCard: Adding bookmark for video:', video.id)
        addBookmark(video.id, '0:00', 'Quick bookmark from video card')
        setBookmarkAdded(true)
        setTimeout(() => setBookmarkAdded(false), 2000)
    }

    const handleDelete = async (e) => {
        e.stopPropagation()
        setIsDeleting(true)
        try {
            deleteVideo(video.id)
            setShowDeleteConfirm(false)
        } catch (error) {
            console.error('Error deleting video:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const formatDuration = (duration) => {
        return duration // Already formatted as "45:30"
    }

    const getProgressColor = () => {
        if (isCompleted) return 'bg-green-500'
        if (progressPercentage > 75) return 'bg-blue-500'
        if (progressPercentage > 50) return 'bg-yellow-500'
        if (progressPercentage > 25) return 'bg-orange-500'
        return 'bg-gray-300'
    }

    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden p-6">
            {/* Content */}
            <div className="flex-1">
                {/* Header with status indicators */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        {/* Completion status */}
                        {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}

                        {/* Play button */}
                        <button
                            onClick={handlePlay}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={handleFavoriteToggle}
                            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isFavorite ? 'text-yellow-500' : 'text-gray-400'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={handleBookmark}
                            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${hasBookmarks || bookmarkAdded ? 'text-primary-600' : 'text-gray-400 hover:text-primary-600'}`}
                            title={bookmarkAdded ? 'Bookmark added!' : 'Add bookmark'}
                        >
                            {bookmarkAdded ? (
                                <Bookmark className="w-4 h-4 fill-current" />
                            ) : (
                                <Bookmark className={`w-4 h-4 ${hasBookmarks ? 'fill-current' : ''}`} />
                            )}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowDeleteConfirm(true)
                            }}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
                            title="Delete video"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        onClick={handlePlay}>
                        {video.title}
                    </h3>
                </div>

                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <User className="w-4 h-4" />
                    <span>{video.instructor}</span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {video.description}
                </p>

                {/* Progress Bar */}
                {progressPercentage > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {progressPercentage}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${video.category === 'Programming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                video.category === 'Mathematics' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    video.category === 'Science' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                        video.category === 'Video Editing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }
            `}>
                            {video.category}
                        </span>

                        {isCompleted && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Completed
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDuration(video.duration)}</span>
                        {video.rating && (
                            <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span>{video.rating}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Delete Video
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    <strong>"{video.title}"</strong> will be permanently deleted along with all its notes and bookmarks.
                                </p>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowDeleteConfirm(false)
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            <span>Delete</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VideoCard 