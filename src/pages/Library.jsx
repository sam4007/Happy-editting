import React, { useState, useEffect } from 'react'
import { Filter, ChevronDown, Plus, SortAsc, SortDesc, Download, Play, CheckCircle, Clock, Star, Youtube, Tag, FolderOpen, X, Search, Grid, List } from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import { useNavigate, useLocation } from 'react-router-dom'
import AddVideoModal from '../components/AddVideoModal'
import CourseImporter from '../components/CourseImporter'
import PlaylistImportModal from '../components/PlaylistImportModal'
import CategoryManager from '../components/CategoryManager'
import PlaylistManager from '../components/PlaylistManager'

// Helper function to format video titles with proper line breaks
const formatVideoTitle = (title) => {
    if (title.length <= 35) {
        return title;
    }

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
                lines.push(word);
                currentLine = '';
            }
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.slice(0, 2).join(' ');
};

const Library = () => {
    const { filteredVideos, categories, selectedCategory, setSelectedCategory, videos, updateVideo, favorites, watchHistory } = useVideo()
    const navigate = useNavigate()
    const location = useLocation()
    const [sortBy, setSortBy] = useState('recent')
    const [sortOrder, setSortOrder] = useState('desc')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showCourseImporter, setShowCourseImporter] = useState(false)
    const [showPlaylistImporter, setShowPlaylistImporter] = useState(false)
    const [showCategoryManager, setShowCategoryManager] = useState(false)
    const [showPlaylistManager, setShowPlaylistManager] = useState(false)
    const [expandedSections, setExpandedSections] = useState({})
    const [activeFilter, setActiveFilter] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('')

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

        // Apply search filter
        if (searchQuery) {
            videosToShow = videosToShow.filter(video =>
                video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                video.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                video.category?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        return videosToShow
    }

    const displayVideos = getFilteredVideos()

    // Get header text based on active filter
    const getHeaderText = () => {
        if (activeFilter === 'favorites') {
            return `Favorite Videos (${displayVideos.length})`
        } else if (activeFilter === 'watch-history') {
            return `Watch History (${displayVideos.length})`
        } else if (selectedCategory) {
            return `${selectedCategory} (${displayVideos.length})`
        }
        return `Video Library (${displayVideos.length})`
    }

    const getHeaderDescription = () => {
        if (activeFilter === 'favorites') {
            return 'Your favorite videos in one place'
        } else if (activeFilter === 'watch-history') {
            return 'Videos you\'ve watched recently'
        }
        return 'Organize and discover your learning content'
    }

    // Group videos by playlist/course
    const groupVideosByPlaylist = (videos) => {
        const grouped = {}

        videos.forEach(video => {
            const key = video.playlistTitle || video.instructor || 'Individual Videos'
            if (!grouped[key]) {
                grouped[key] = []
            }
            grouped[key].push(video)
        })

        return grouped
    }

    // Handle video click
    const handleVideoClick = (video) => {
        navigate(`/video/${video.id}`)
    }

    // Toggle section expansion
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }))
    }

    // Sort videos
    const sortedVideos = [...displayVideos].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title)
                break
            case 'duration':
                const getDurationMinutes = (duration) => {
                    if (!duration) return 0
                    const parts = duration.split(':').map(Number)
                    return parts.length === 2 ? parts[0] + parts[1] / 60 : parts[0] * 60 + parts[1] + parts[2] / 60
                }
                comparison = getDurationMinutes(a.duration) - getDurationMinutes(b.duration)
                break
            case 'progress':
                comparison = (a.progress || 0) - (b.progress || 0)
                break
            case 'rating':
                comparison = (a.rating || 0) - (b.rating || 0)
                break
            default: // recent
                if (activeFilter === 'watch-history') {
                    const aIndex = watchHistory.indexOf(a.id)
                    const bIndex = watchHistory.indexOf(b.id)
                    comparison = aIndex - bIndex
                } else {
                    comparison = new Date(a.uploadDate) - new Date(b.uploadDate)
                }
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })

    const groupedVideos = groupVideosByPlaylist(sortedVideos)

    const sortOptions = [
        { value: 'recent', label: 'Recently Added' },
        { value: 'title', label: 'Title' },
        { value: 'duration', label: 'Duration' },
        { value: 'progress', label: 'Progress' },
        { value: 'rating', label: 'Rating' }
    ]

    return (
        <div className="min-h-screen animate-fade-in">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                                <h1 className="text-3xl font-light text-gray-900 dark:text-white">
                                    {getHeaderText()}
                                </h1>
                                {activeFilter && (
                                    <button
                                        onClick={clearFilter}
                                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                        title="Clear filter"
                                    >
                                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {getHeaderDescription()}
                            </p>

                            {/* Filter Badge */}
                            {activeFilter && (
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium glass-card">
                                    {activeFilter === 'favorites' ? (
                                        <>
                                            <Star className="w-4 h-4 mr-2 text-yellow-500" />
                                            Favorites
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                            Watch History
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {!activeFilter && (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowPlaylistImporter(true)}
                                    className="btn-secondary flex items-center space-x-2"
                                >
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    <span>Import Playlist</span>
                                </button>
                                <button
                                    onClick={() => setShowCourseImporter(true)}
                                    className="btn-secondary flex items-center space-x-2"
                                >
                                    <Download className="w-4 h-4 text-purple-500" />
                                    <span>Import Course</span>
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Video</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search and Controls Bar */}
                    <div className="glass-card p-4 mt-6">
                        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search videos, instructors, categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-premium pl-10"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Sort Controls */}
                                <div className="flex items-center space-x-3">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="input-premium text-sm min-w-0"
                                    >
                                        {sortOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                        title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                                    >
                                        {sortOrder === 'asc' ?
                                            <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-400" /> :
                                            <SortDesc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        }
                                    </button>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center space-x-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                            ? 'bg-white dark:bg-gray-700 shadow-sm'
                                            : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Grid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                            ? 'bg-white dark:bg-gray-700 shadow-sm'
                                            : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {displayVideos.length > 0 ? (
                    <div className="space-y-8">
                        {Object.entries(groupedVideos).map(([sectionTitle, sectionVideos]) => {
                            const sectionKey = sectionTitle.replace(/\s+/g, '_').toLowerCase()
                            const isExpanded = expandedSections[sectionKey] !== false

                            return (
                                <div key={sectionTitle} className="glass-card overflow-hidden">
                                    {/* Section Header */}
                                    <div className="p-6 border-b border-white/10 dark:border-white/5">
                                        <button
                                            onClick={() => toggleSection(sectionKey)}
                                            className="flex items-center justify-between w-full text-left group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {sectionTitle}
                                                </h3>
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    {sectionVideos.length} video{sectionVideos.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                                                }`} />
                                        </button>
                                    </div>

                                    {/* Videos Grid/List */}
                                    {isExpanded && (
                                        <div className="p-6">
                                            {viewMode === 'grid' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {sectionVideos.map((video) => (
                                                        <div
                                                            key={video.id}
                                                            className="group cursor-pointer"
                                                            onClick={() => handleVideoClick(video)}
                                                        >
                                                            <div className="glass-card p-4 h-full hover:scale-[1.02] transition-transform">
                                                                {/* Video Thumbnail */}
                                                                <div className="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 aspect-video">
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <Play className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                                    </div>
                                                                    {video.progress > 0 && (
                                                                        <div className="absolute bottom-2 left-2 right-2">
                                                                            <div className="w-full bg-black/20 rounded-full h-1">
                                                                                <div
                                                                                    className="bg-indigo-500 rounded-full h-1 transition-all"
                                                                                    style={{ width: `${video.progress}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Video Info */}
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                        {formatVideoTitle(video.title)}
                                                                    </h4>

                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {video.instructor}
                                                                    </p>

                                                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                        <div className="flex items-center space-x-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            <span>{video.duration}</span>
                                                                        </div>
                                                                        {video.rating && (
                                                                            <div className="flex items-center space-x-1">
                                                                                <Star className="w-3 h-3 text-yellow-500" />
                                                                                <span>{video.rating}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {sectionVideos.map((video) => (
                                                        <div
                                                            key={video.id}
                                                            className="flex items-center space-x-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                                            onClick={() => handleVideoClick(video)}
                                                        >
                                                            {/* Thumbnail */}
                                                            <div className="w-16 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Play className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                            </div>

                                                            {/* Video Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                    {video.title}
                                                                </h4>
                                                                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                                                                    <span>{video.instructor}</span>
                                                                    <span>•</span>
                                                                    <span>{video.duration}</span>
                                                                    {video.rating && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <div className="flex items-center space-x-1">
                                                                                <Star className="w-3 h-3 text-yellow-500" />
                                                                                <span>{video.rating}</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Progress */}
                                                            {video.progress > 0 && (
                                                                <div className="hidden sm:flex items-center space-x-2 flex-shrink-0">
                                                                    <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                                        <div
                                                                            className="bg-indigo-500 rounded-full h-1.5 transition-all"
                                                                            style={{ width: `${video.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                                                                        {video.progress}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Status Icons */}
                                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                                {video.completed && (
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                )}
                                                                {favorites.includes(video.id) && (
                                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="glass-card p-8 max-w-md mx-auto">
                            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {activeFilter === 'favorites' ? 'No favorite videos' :
                                    activeFilter === 'watch-history' ? 'No watch history' :
                                        searchQuery ? 'No videos found' : 'No videos yet'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {activeFilter === 'favorites' ? 'Mark videos as favorites to see them here' :
                                    activeFilter === 'watch-history' ? 'Videos you watch will appear here' :
                                        searchQuery ? 'Try adjusting your search terms' : 'Import some videos to get started'}
                            </p>
                            {activeFilter ? (
                                <button
                                    onClick={clearFilter}
                                    className="btn-primary"
                                >
                                    View All Videos
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn-primary"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Video
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Modals */}
                <AddVideoModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                />

                <CourseImporter
                    isOpen={showCourseImporter}
                    onClose={() => setShowCourseImporter(false)}
                />

                <PlaylistImportModal
                    isOpen={showPlaylistImporter}
                    onClose={() => setShowPlaylistImporter(false)}
                />

                <CategoryManager
                    isOpen={showCategoryManager}
                    onClose={() => setShowCategoryManager(false)}
                />

                <PlaylistManager
                    isOpen={showPlaylistManager}
                    onClose={() => setShowPlaylistManager(false)}
                />
            </div>
        </div>
    )
}

export default Library 