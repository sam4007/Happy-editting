import React, { useState } from 'react'
import { useVideo } from '../contexts/VideoContext'
import { Trash2, AlertTriangle, Play, Clock, User, Tag, Calendar, CheckCircle, X, Youtube, FileText, ExternalLink } from 'lucide-react'

const PlaylistManager = ({ isOpen, onClose }) => {
    const { getPlaylistInfo, deletePlaylist } = useVideo()
    const [deleteConfirmation, setDeleteConfirmation] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Don't render if not open
    if (!isOpen) return null

    const playlists = getPlaylistInfo()

    const handleDeletePlaylist = async (playlistId) => {
        setIsDeleting(true)
        try {
            const success = deletePlaylist(playlistId)
            if (success) {
                setDeleteConfirmation(null)
                // Show success message briefly
                setTimeout(() => {
                    // Component will re-render with updated playlist list
                }, 100)
            }
        } catch (error) {
            console.error('Error deleting playlist:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = Math.floor(minutes % 60)
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const getSourceIcon = (source) => {
        switch (source) {
            case 'youtube-playlist':
                return <Youtube className="h-4 w-4 text-red-600" />
            case 'manual':
                return <FileText className="h-4 w-4 text-blue-600" />
            default:
                return <Play className="h-4 w-4 text-gray-600" />
        }
    }

    const getSourceLabel = (source) => {
        switch (source) {
            case 'youtube-playlist':
                return 'YouTube Playlist'
            case 'manual':
                return 'Manual Entry'
            default:
                return 'Unknown Source'
        }
    }

    if (playlists.length === 0) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Playlist Manager
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="p-6 text-center">
                        <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Playlists Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Import some playlists to get started with playlist management.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Playlist Manager
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage your imported playlists and courses
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Playlist List */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
                            >
                                {/* Playlist Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        {getSourceIcon(playlist.source)}
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {getSourceLabel(playlist.source)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setDeleteConfirmation(playlist.id)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                        title="Delete playlist"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                </div>

                                {/* Playlist Info */}
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {playlist.title}
                                        </h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="flex items-center space-x-1">
                                                <User className="h-3 w-3" />
                                                <span>{playlist.instructor}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <Tag className="h-3 w-3" />
                                                <span>{playlist.category}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white dark:bg-gray-800 rounded p-3">
                                            <div className="flex items-center space-x-2">
                                                <Play className="h-4 w-4 text-blue-600" />
                                                <span className="text-gray-500 dark:text-gray-400">Videos</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {playlist.totalVideos}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded p-3">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-green-600" />
                                                <span className="text-gray-500 dark:text-gray-400">Duration</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatDuration(playlist.totalDuration)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-500 dark:text-gray-400">Progress</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {playlist.completedVideos} / {playlist.totalVideos}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${playlist.totalVideos > 0 ? (playlist.completedVideos / playlist.totalVideos) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {playlist.totalVideos > 0 ? Math.round((playlist.completedVideos / playlist.totalVideos) * 100) : 0}% complete
                                        </p>
                                    </div>

                                    {/* Import Date */}
                                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            Imported {new Date(playlist.importDate).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Original URL if available */}
                                    {playlist.originalUrl && (
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <a
                                                href={playlist.originalUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                <span>View Original</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                            <div className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Delete Playlist
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            This action cannot be undone
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        <strong>Warning:</strong> This will permanently delete:
                                    </p>
                                    <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                                        <li>• All videos in this playlist</li>
                                        <li>• All associated notes and bookmarks</li>
                                        <li>• Watch history and progress data</li>
                                        <li>• Favorites and other related data</li>
                                    </ul>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setDeleteConfirmation(null)}
                                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlaylist(deleteConfirmation)}
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
                                                <span>Delete Playlist</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PlaylistManager 