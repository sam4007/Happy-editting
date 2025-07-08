import React, { useState, useEffect } from 'react'
import { Filter, ChevronDown, ChevronRight, Plus, SortAsc, SortDesc, Download, Play, CheckCircle, Circle, Clock, User, Star, Youtube, Tag, Settings, FolderOpen, X } from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import { useNavigate, useLocation } from 'react-router-dom'
import AddVideoModal from '../components/AddVideoModal'
import CourseImporter from '../components/CourseImporter'
import CourseLayout from '../components/CourseLayout'
import PlaylistImportModal from '../components/PlaylistImportModal'
import CategoryManager from '../components/CategoryManager'
import PlaylistManager from '../components/PlaylistManager'

const Library = () => {
    const { filteredVideos, categories, selectedCategory, setSelectedCategory, videos, updateVideo, favorites, watchHistory } = useVideo()
    const navigate = useNavigate()
    const location = useLocation()
    const [sortBy, setSortBy] = useState('recent') // 'recent', 'title', 'duration', 'progress'
    const [sortOrder, setSortOrder] = useState('desc') // 'asc' or 'desc'
    const [showAddModal, setShowAddModal] = useState(false)
    const [showCourseImporter, setShowCourseImporter] = useState(false)
    const [showPlaylistImporter, setShowPlaylistImporter] = useState(false)
    const [showCategoryManager, setShowCategoryManager] = useState(false)
    const [showPlaylistManager, setShowPlaylistManager] = useState(false)
    const [expandedSections, setExpandedSections] = useState({})
    const [activeFilter, setActiveFilter] = useState(null) // 'favorites', 'watch-history', null

    // Handle URL parameters for filtering
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const filter = params.get('filter')

        if (filter === 'favorites' || filter === 'watch-history') {
            setActiveFilter(filter)
        } else {
            setActiveFilter(null)
        }
    }, [location.search])

    // Clear filter function
    const clearFilter = () => {
        setActiveFilter(null)
        navigate('/library')
    }

    // Get filtered videos based on active filter
    const getFilteredVideos = () => {
        let videosToShow = filteredVideos

        if (activeFilter === 'favorites') {
            videosToShow = filteredVideos.filter(video => favorites.includes(video.id))
        } else if (activeFilter === 'watch-history') {
            videosToShow = watchHistory.map(id => videos.find(v => v.id === id)).filter(Boolean)
        }

        return videosToShow
    }

    // Use filtered videos based on active filter
    const displayVideos = getFilteredVideos()

    // Update header text based on active filter
    const getHeaderText = () => {
        if (activeFilter === 'favorites') {
            return `Favorite Videos (${displayVideos.length})`
        } else if (activeFilter === 'watch-history') {
            return `Watch History (${displayVideos.length})`
        }
        return `Video Library (${displayVideos.length})`
    }

    const getHeaderDescription = () => {
        if (activeFilter === 'favorites') {
            return 'Videos you\'ve marked as favorites'
        } else if (activeFilter === 'watch-history') {
            return 'Recently watched videos'
        }
        return `${displayVideos.length} video${displayVideos.length !== 1 ? 's' : ''}${selectedCategory !== 'All' && !activeFilter ? ` in ${selectedCategory}` : ''}`
    }

    // Toggle dropdown sections
    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }))
    }

    // Group videos by category and then by playlist
    const groupVideosByPlaylist = (videos) => {
        // First group by category
        const categorizedVideos = videos.reduce((acc, video) => {
            const category = video.category
            if (!acc[category]) {
                acc[category] = []
            }
            acc[category].push(video)
            return acc
        }, {})

        // Then group each category by playlist
        const result = {}
        Object.keys(categorizedVideos).forEach(category => {
            const categoryVideos = categorizedVideos[category]

            // Group videos by playlist within this category
            const playlistGroups = categoryVideos.reduce((acc, video) => {
                // Create playlist identifier
                const playlistKey = `${video.source || 'manual'}_${video.instructor}_${video.category}`
                const playlistTitle = video.playlistTitle || `${video.instructor} - ${video.category}`

                if (!acc[playlistKey]) {
                    acc[playlistKey] = {
                        id: playlistKey,
                        title: playlistTitle,
                        instructor: video.instructor,
                        category: video.category,
                        source: video.source || 'manual',
                        originalUrl: video.originalUrl || '',
                        importDate: video.importDate || video.dateAdded || new Date().toISOString(),
                        videos: []
                    }
                }

                acc[playlistKey].videos.push(video)
                return acc
            }, {})

            result[category] = Object.values(playlistGroups)
        })

        return result
    }

    // Handle video actions
    const toggleVideoCompletion = (video) => {
        updateVideo(video.id, { completed: !video.completed })
    }

    const handleVideoClick = (video) => {
        navigate(`/video/${video.id}`)
    }

    // Sort videos - use displayVideos instead of filteredVideos
    const sortedVideos = [...displayVideos].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title)
                break
            case 'duration':
                const aDuration = a.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
                const bDuration = b.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
                comparison = aDuration - bDuration
                break
            case 'progress':
                comparison = (a.progress || 0) - (b.progress || 0)
                break
            case 'rating':
                comparison = (a.rating || 0) - (b.rating || 0)
                break
            case 'recent':
            default:
                if (activeFilter === 'watch-history') {
                    // For watch history, sort by watch order (most recent first)
                    const aIndex = watchHistory.indexOf(a.id)
                    const bIndex = watchHistory.indexOf(b.id)
                    comparison = aIndex - bIndex
                } else {
                    comparison = new Date(a.uploadDate) - new Date(b.uploadDate)
                }
                break
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })

    // Group videos for hierarchical display
    const groupedVideos = groupVideosByPlaylist(sortedVideos)

    const sortOptions = [
        { value: 'recent', label: 'Recently Added' },
        { value: 'title', label: 'Title' },
        { value: 'duration', label: 'Duration' },
        { value: 'progress', label: 'Progress' },
        { value: 'rating', label: 'Rating' }
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64">
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {getHeaderText()}
                            </h1>
                            {activeFilter && (
                                <button
                                    onClick={clearFilter}
                                    className="mb-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    title="Clear filter"
                                >
                                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            {getHeaderDescription()}
                        </p>
                        {activeFilter && (
                            <div className="mt-2 flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                                    {activeFilter === 'favorites' ? (
                                        <>
                                            <Star className="w-3 h-3 mr-1" />
                                            Favorites
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            Watch History
                                        </>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    {!activeFilter && (
                        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                            <button
                                onClick={() => setShowPlaylistImporter(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <Youtube className="w-5 h-5" />
                                <span>Import Playlist</span>
                            </button>
                            <button
                                onClick={() => setShowPlaylistManager(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <FolderOpen className="w-5 h-5" />
                                <span>Manage Playlists</span>
                            </button>
                            <button
                                onClick={() => setShowCategoryManager(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <Tag className="w-5 h-5" />
                                <span>Manage Categories</span>
                            </button>
                            <button
                                onClick={() => setShowCourseImporter(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                <span>Import Course</span>
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Video</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters and Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Sort Controls */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <SortDesc className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Videos Hierarchical Dropdown Layout */}
                {sortedVideos.length > 0 ? (
                    selectedCategory === 'Video Editing' ? (
                        <CourseLayout
                            videos={sortedVideos}
                            courseName="Happy Editting"
                        />
                    ) : (
                        <div className="space-y-4">
                            {/* Filter by selected category or show all */}
                            {(selectedCategory === 'All' ? Object.keys(groupedVideos) : [selectedCategory])
                                .filter(categoryName => groupedVideos[categoryName]?.length > 0)
                                .map(categoryName => {
                                    const categoryPlaylists = groupedVideos[categoryName]
                                    const isCategoryExpanded = expandedSections[categoryName]

                                    // Calculate category-level stats
                                    const categoryTotalVideos = categoryPlaylists.reduce((sum, playlist) => sum + playlist.videos.length, 0)
                                    const categoryCompletedVideos = categoryPlaylists.reduce((sum, playlist) =>
                                        sum + playlist.videos.filter(v => v.completed).length, 0
                                    )
                                    const categoryProgress = categoryTotalVideos > 0 ? (categoryCompletedVideos / categoryTotalVideos) * 100 : 0

                                    return (
                                        <div key={categoryName} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            {/* Category Header */}
                                            <button
                                                onClick={() => toggleSection(categoryName)}
                                                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    {isCategoryExpanded ? (
                                                        <ChevronDown className="w-6 h-6 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="w-6 h-6 text-gray-500" />
                                                    )}
                                                    <div className="text-left">
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {categoryName}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {categoryPlaylists.length} playlist{categoryPlaylists.length !== 1 ? 's' : ''} • {categoryTotalVideos} video{categoryTotalVideos !== 1 ? 's' : ''} • {categoryCompletedVideos}/{categoryTotalVideos} completed
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Category Progress Bar */}
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 rounded-full h-2 transition-all duration-300"
                                                            style={{ width: `${categoryProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12">
                                                        {Math.round(categoryProgress)}%
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Category Content - Playlists */}
                                            {isCategoryExpanded && (
                                                <div className="border-t border-gray-200 dark:border-gray-700">
                                                    {categoryPlaylists.map((playlist, playlistIndex) => {
                                                        const playlistKey = `${categoryName}-${playlist.id}`
                                                        const isPlaylistExpanded = expandedSections[playlistKey]
                                                        const completedCount = playlist.videos.filter(v => v.completed).length
                                                        const totalCount = playlist.videos.length
                                                        const playlistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

                                                        return (
                                                            <div key={playlist.id} className={`${playlistIndex !== categoryPlaylists.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                                                                {/* Playlist Header */}
                                                                <button
                                                                    onClick={() => toggleSection(playlistKey)}
                                                                    className="w-full flex items-center justify-between p-4 pl-12 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                                >
                                                                    <div className="flex items-center space-x-3">
                                                                        {isPlaylistExpanded ? (
                                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                        ) : (
                                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                                        )}
                                                                        <div className="text-left">
                                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                                {playlist.title}
                                                                            </h4>
                                                                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                                                <span>{playlist.instructor}</span>
                                                                                <span>{playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}</span>
                                                                                <span>{completedCount}/{totalCount} completed</span>
                                                                                {playlist.source === 'youtube' && (
                                                                                    <div className="flex items-center space-x-1">
                                                                                        <Youtube className="w-4 h-4 text-red-500" />
                                                                                        <span>YouTube</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Playlist Progress Bar */}
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                                            <div
                                                                                className="bg-blue-500 rounded-full h-1.5 transition-all duration-300"
                                                                                style={{ width: `${playlistProgress}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8">
                                                                            {Math.round(playlistProgress)}%
                                                                        </span>
                                                                    </div>
                                                                </button>

                                                                {/* Playlist Videos */}
                                                                {isPlaylistExpanded && (
                                                                    <div className="bg-gray-50 dark:bg-gray-700">
                                                                        {playlist.videos.map((video, videoIndex) => (
                                                                            <div
                                                                                key={video.id}
                                                                                className={`flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors p-4 pl-16 ${videoIndex !== playlist.videos.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                                                                            >
                                                                                {/* Completion Checkbox */}
                                                                                <button
                                                                                    onClick={() => toggleVideoCompletion(video)}
                                                                                    className="flex-shrink-0 mr-4"
                                                                                >
                                                                                    {video.completed ? (
                                                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                                                    ) : (
                                                                                        <Circle className="w-5 h-5 text-gray-400 hover:text-green-500 transition-colors" />
                                                                                    )}
                                                                                </button>

                                                                                {/* Video Info */}
                                                                                <div className="flex-1 min-w-0 mr-4">
                                                                                    <button
                                                                                        onClick={() => handleVideoClick(video)}
                                                                                        className="text-left w-full group"
                                                                                    >
                                                                                        <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                                                            {video.title}
                                                                                        </h5>
                                                                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                                            <div className="flex items-center space-x-1">
                                                                                                <Clock className="w-4 h-4" />
                                                                                                <span>{video.duration}</span>
                                                                                            </div>
                                                                                            {video.rating && (
                                                                                                <div className="flex items-center space-x-1">
                                                                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                                                                    <span>{video.rating}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        {video.description && (
                                                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                                                                {video.description}
                                                                                            </p>
                                                                                        )}
                                                                                    </button>
                                                                                </div>

                                                                                {/* Action Buttons */}
                                                                                <div className="flex items-center space-x-3">
                                                                                    {/* Progress Indicator */}
                                                                                    {video.progress > 0 && (
                                                                                        <div className="flex items-center space-x-1">
                                                                                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                                                                                <div
                                                                                                    className="bg-blue-500 rounded-full h-1 transition-all duration-300"
                                                                                                    style={{ width: `${video.progress}%` }}
                                                                                                />
                                                                                            </div>
                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                {video.progress}%
                                                                                            </span>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Play Button */}
                                                                                    <button
                                                                                        onClick={() => handleVideoClick(video)}
                                                                                        className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                                                                                    >
                                                                                        <Play className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12">
                        <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {activeFilter === 'favorites' ? 'No favorite videos' :
                                activeFilter === 'watch-history' ? 'No watch history' :
                                    'No videos found'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {activeFilter === 'favorites' ? 'Mark videos as favorites to see them here' :
                                activeFilter === 'watch-history' ? 'Videos you watch will appear here' :
                                    'Try adjusting your search or import some videos'}
                        </p>
                        {activeFilter && (
                            <button
                                onClick={clearFilter}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                            >
                                View All Videos
                            </button>
                        )}
                    </div>
                )}

                {/* Modals */}
                {showAddModal && (
                    <AddVideoModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                    />
                )}

                {showCourseImporter && (
                    <CourseImporter
                        isOpen={showCourseImporter}
                        onClose={() => setShowCourseImporter(false)}
                    />
                )}

                {showPlaylistImporter && (
                    <PlaylistImportModal
                        isOpen={showPlaylistImporter}
                        onClose={() => setShowPlaylistImporter(false)}
                    />
                )}

                {showCategoryManager && (
                    <CategoryManager
                        isOpen={showCategoryManager}
                        onClose={() => setShowCategoryManager(false)}
                    />
                )}

                {showPlaylistManager && (
                    <PlaylistManager
                        isOpen={showPlaylistManager}
                        onClose={() => setShowPlaylistManager(false)}
                    />
                )}
            </div>
        </div>
    )
}

export default Library 