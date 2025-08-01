import React, { useState } from 'react'
import { useVideo } from '../contexts/VideoContext'
import { Trash2, AlertTriangle, Play, Clock, User, Tag, Calendar, CheckCircle, X, Youtube, FileText, ExternalLink, GripVertical, Move } from 'lucide-react'

const PlaylistManager = ({ isOpen, onClose }) => {
    const { getPlaylistInfo, deletePlaylist, reorderPlaylist } = useVideo()
    const [deleteConfirmation, setDeleteConfirmation] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [draggedPlaylist, setDraggedPlaylist] = useState(null)
    const [isReordering, setIsReordering] = useState(false)


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

    // Drag and drop handlers
    const handleDragStart = (e, playlist) => {
        setDraggedPlaylist(playlist)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', playlist.id)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e, targetPlaylist) => {
        e.preventDefault()

        if (!draggedPlaylist || draggedPlaylist.id === targetPlaylist.id) {
            setDraggedPlaylist(null)
            return
        }

        // Find the new position for the dragged playlist
        const playlists = getPlaylistInfo()
        const targetIndex = playlists.findIndex(p => p.id === targetPlaylist.id)

        if (targetIndex !== -1) {
            setIsReordering(true)
            try {
                const success = reorderPlaylist(draggedPlaylist.id, targetIndex)
                if (success) {
                    // Force re-render by updating state
                    setTimeout(() => {
                        setIsReordering(false)
                    }, 100)
                }
            } catch (error) {
                console.error('Error reordering playlist:', error)
            } finally {
                setIsReordering(false)
            }
        }

        setDraggedPlaylist(null)
    }

    const handleDragEnd = () => {
        setDraggedPlaylist(null)
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 lg:pl-64 pt-20">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl w-full max-w-md">
                    <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-gray-700/30">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Playlist Manager
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                    <div className="p-8 text-center">
                        <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl inline-block mb-6">
                            <Play className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            No Playlists Found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Import some playlists to get started with playlist management.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 lg:pl-64 pt-20">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-gray-700/30">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Playlist Manager
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Organize and manage your learning content
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Playlist List */}
                <div className="p-6 overflow-y-auto max-h-[calc(75vh-200px)]">
                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                <Move className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Drag playlists to reorder • Click trash icon to delete
                        </p>
                    </div>

                    {isReordering && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl">
                            <div className="flex items-center space-x-3 text-blue-800 dark:text-blue-200">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                <span className="text-sm font-medium">Updating playlist order...</span>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4 pb-4">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, playlist)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, playlist)}
                                onDragEnd={handleDragEnd}
                                className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/30 cursor-move transition-all duration-300 ${draggedPlaylist?.id === playlist.id
                                    ? 'opacity-60 scale-95 shadow-2xl'
                                    : 'hover:shadow-xl hover:scale-[1.02] hover:border-indigo-200/50 dark:hover:border-indigo-700/50'
                                    } ${isReordering ? 'pointer-events-none' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left side - Drag handle and basic info */}
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                                            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                <GripVertical className="h-3 w-3" />
                                            </div>
                                            <span className="text-xs font-medium">Drag</span>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl">
                                                {getSourceIcon(playlist.source)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                                                    {playlist.title}
                                                </h3>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                        </div>
                                    </div>

                                    {/* Center - Statistics */}
                                    <div className="flex items-center space-x-6 text-xs">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                                                <Play className="h-3 w-3" />
                                                <span>Videos</span>
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {playlist.totalVideos}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                                                <Clock className="h-3 w-3" />
                                                <span>Duration</span>
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {formatDuration(playlist.totalDuration)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                                                <span>Progress</span>
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {playlist.completedVideos} / {playlist.totalVideos}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right side - Actions and date */}
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(playlist.importDate).toLocaleDateString()}</span>
                                            </div>
                                            {playlist.originalUrl && (
                                                <a
                                                    href={playlist.originalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mt-1"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    <span>Original</span>
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setDeleteConfirmation(playlist.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all duration-200"
                                            title="Delete playlist"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar below */}
                                <div className="mt-4">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${playlist.totalVideos > 0 ? (playlist.completedVideos / playlist.totalVideos) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center font-medium">
                                        {playlist.totalVideos > 0 ? Math.round((playlist.completedVideos / playlist.totalVideos) * 100) : 0}% complete
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>


                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:pl-64">
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