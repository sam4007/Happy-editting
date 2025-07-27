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

// Add a helper function to format video titles with proper line breaks
const formatVideoTitle = (title) => {
    if (title.length <= 35) {
        return title;
    }

    // For titles longer than 35 characters, try to break at natural points
    const words = title.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= 35) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // If a single word is longer than 35 chars, we'll have to break it
                lines.push(word);
                currentLine = '';
            }
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    // Return the title with proper structure for display
    return lines.slice(0, 2).join(' '); // Limit to 2 lines worth of content
};

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64 viewport-constrained">
            <div className="p-3 sm:p-4 lg:p-6 max-w-full overflow-hidden">
                {/* Header */}
                <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                                    {getHeaderText()}
                                </h1>
                                {activeFilter && (
                                    <button
                                        onClick={clearFilter}
                                        className="mb-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                                        title="Clear filter"
                                    >
                                        <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                {getHeaderDescription()}
                            </p>
                            {activeFilter && (
                                <div className="mt-2 flex items-center">
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
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowPlaylistImporter(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-colors text-sm"
                                >
                                    <Youtube className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">Import Playlist</span>
                                </button>
                                <button
                                    onClick={() => setShowPlaylistManager(true)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-colors text-sm"
                                >
                                    <FolderOpen className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">Manage Playlists</span>
                                </button>
                                <button
                                    onClick={() => setShowCategoryManager(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-colors text-sm"
                                >
                                    <Tag className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">Manage Categories</span>
                                </button>
                                <button
                                    onClick={() => setShowCourseImporter(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-colors text-sm"
                                >
                                    <Download className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">Import Course</span>
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-colors text-sm xs:col-span-2 sm:col-span-3 lg:col-span-1"
                                >
                                    <Plus className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">Add Video</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-w-full">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${selectedCategory === category
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span className="truncate">{category}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sort Controls */}
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <SortDesc className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600 dark:text-gray-400" />
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
                            courseName="Lumière Course"
                        />
                    ) : (
                        <div className="space-y-4 max-w-full overflow-hidden">
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
                                        <div key={categoryName} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-full">
                                            {/* Category Header */}
                                            <button
                                                onClick={() => toggleSection(categoryName)}
                                                className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors overflow-hidden"
                                            >
                                                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 overflow-hidden">
                                                    {isCategoryExpanded ? (
                                                        <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-500 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6 text-gray-500 flex-shrink-0" />
                                                    )}
                                                    <div className="text-left min-w-0 flex-1 overflow-hidden">
                                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                                            {categoryName}
                                                        </h3>
                                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                                            {categoryPlaylists.length} playlist{categoryPlaylists.length !== 1 ? 's' : ''} • {categoryTotalVideos} video{categoryTotalVideos !== 1 ? 's' : ''} • {categoryCompletedVideos}/{categoryTotalVideos} completed
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Category Progress Bar */}
                                                <div className="hidden sm:flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
                                                    <div className="w-24 lg:w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 rounded-full h-2 transition-all duration-300"
                                                            style={{ width: `${categoryProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 w-8 lg:w-12 text-center">
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
                                                            <div key={playlist.id} className={`${playlistIndex !== categoryPlaylists.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''} max-w-full overflow-hidden`}>
                                                                {/* Playlist Header */}
                                                                <button
                                                                    onClick={() => toggleSection(playlistKey)}
                                                                    className="w-full flex items-center justify-between p-3 sm:p-4 pl-6 sm:pl-8 lg:pl-12 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors overflow-hidden"
                                                                >
                                                                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 overflow-hidden">
                                                                        {isPlaylistExpanded ? (
                                                                            <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 flex-shrink-0" />
                                                                        ) : (
                                                                            <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 flex-shrink-0" />
                                                                        )}
                                                                        <div className="text-left min-w-0 flex-1 overflow-hidden">
                                                                            <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                                                {playlist.title}
                                                                            </h4>
                                                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                                <span className="truncate max-w-32 sm:max-w-none">{playlist.instructor}</span>
                                                                                <span className="flex-shrink-0">{playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}</span>
                                                                                <span className="flex-shrink-0">{completedCount}/{totalCount} completed</span>
                                                                                {playlist.source === 'youtube' && (
                                                                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                                                                        <Youtube className="w-3 sm:w-4 h-3 sm:h-4 text-red-500" />
                                                                                        <span>YouTube</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Playlist Progress Bar */}
                                                                    <div className="hidden sm:flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                                                                        <div className="w-16 sm:w-20 lg:w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                                            <div
                                                                                className="bg-blue-500 rounded-full h-1.5 transition-all duration-300"
                                                                                style={{ width: `${playlistProgress}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-6 lg:w-8 text-center">
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
                                                                                className={`flex items-start hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors p-3 sm:p-4 pl-8 sm:pl-12 lg:pl-16 ${videoIndex !== playlist.videos.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''} max-w-full overflow-hidden`}
                                                                            >
                                                                                {/* Completion Checkbox */}
                                                                                <button
                                                                                    onClick={() => toggleVideoCompletion(video)}
                                                                                    className="flex-shrink-0 mr-2 sm:mr-3 lg:mr-4 mt-0.5"
                                                                                >
                                                                                    {video.completed ? (
                                                                                        <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
                                                                                    ) : (
                                                                                        <Circle className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 hover:text-green-500 transition-colors" />
                                                                                    )}
                                                                                </button>

                                                                                {/* Video Info */}
                                                                                <div className="flex-1 min-w-0 mr-2 sm:mr-3 lg:mr-4 overflow-hidden">
                                                                                    <button
                                                                                        onClick={() => handleVideoClick(video)}
                                                                                        className="text-left w-full group max-w-full"
                                                                                    >
                                                                                        <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight max-w-full break-words line-clamp-2 no-overflow">
                                                                                            {formatVideoTitle(video.title)}
                                                                                        </h5>
                                                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                                                                                <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                                                <span>{video.duration}</span>
                                                                                            </div>
                                                                                            {video.rating && (
                                                                                                <div className="flex items-center space-x-1 flex-shrink-0">
                                                                                                    <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-500" />
                                                                                                    <span>{video.rating}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </button>
                                                                                </div>

                                                                                {/* Action Buttons */}
                                                                                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                                                                                    {/* Progress Indicator */}
                                                                                    {video.progress > 0 && (
                                                                                        <div className="hidden sm:flex items-center space-x-1 flex-shrink-0">
                                                                                            <div className="w-12 lg:w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                                                                                <div
                                                                                                    className="bg-blue-500 rounded-full h-1 transition-all duration-300"
                                                                                                    style={{ width: `${video.progress}%` }}
                                                                                                />
                                                                                            </div>
                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-center">
                                                                                                {video.progress}%
                                                                                            </span>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Play Button */}
                                                                                    <button
                                                                                        onClick={() => handleVideoClick(video)}
                                                                                        className="flex-shrink-0 w-7 sm:w-8 h-7 sm:h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                                                                                    >
                                                                                        <Play className="w-3 sm:w-4 h-3 sm:h-4 text-primary-600 dark:text-primary-400" />
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