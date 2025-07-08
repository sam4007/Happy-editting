import React, { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Circle, Play, Clock, Star, User } from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import { useNavigate } from 'react-router-dom'

const CourseLayout = ({ videos, courseName, compact = false, currentVideoId = null }) => {
    const { updateVideo } = useVideo()
    const navigate = useNavigate()
    const [expandedSections, setExpandedSections] = useState({})

    // Auto-expand first section by default
    React.useEffect(() => {
        if (videos.length > 0) {
            const firstModule = videos[0]?.module || 'Other'
            setExpandedSections(prev => ({
                ...prev,
                [firstModule]: true
            }))
        }
    }, [videos])

    // Group videos by module
    const groupedVideos = videos.reduce((acc, video) => {
        const module = video.module || 'Other'
        if (!acc[module]) {
            acc[module] = []
        }
        acc[module].push(video)
        return acc
    }, {})

    // Calculate section progress
    const getSectionProgress = (sectionVideos) => {
        const completed = sectionVideos.filter(v => v.completed).length
        const total = sectionVideos.length
        const percentage = total > 0 ? (completed / total) * 100 : 0
        return { completed, total, percentage }
    }

    // Calculate overall course progress
    const overallProgress = getSectionProgress(videos)

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }))
    }

    const toggleVideoCompletion = (video) => {
        console.log('Toggling completion for video:', video.title, 'from', video.completed, 'to', !video.completed)
        updateVideo(video.id, { completed: !video.completed })
    }

    const handleVideoClick = (video) => {
        navigate(`/video/${video.id}`)
    }

    return (
        <div className="space-y-6">
            {/* Course Header */}
            <div className={`bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl text-white ${compact ? 'p-4' : 'p-6'}`}>
                <h2 className={`font-bold mb-2 ${compact ? 'text-lg' : 'text-2xl'}`}>{courseName}</h2>
                <div className={`flex items-center space-x-3 ${compact ? 'mb-3' : 'mb-4'}`}>
                    <span className="text-purple-100 text-sm">{videos.length} lessons</span>
                    <span className="text-purple-100">•</span>
                    <span className="text-purple-100 text-sm">{overallProgress.completed}/{overallProgress.total} completed</span>
                </div>

                {/* Overall Progress Bar */}
                <div className="w-full bg-purple-800 rounded-full h-2">
                    <div
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${overallProgress.percentage}%` }}
                    />
                </div>
                <p className="text-xs text-purple-100 mt-2">
                    {Math.round(overallProgress.percentage)}% Complete
                </p>
            </div>

            {/* Course Sections */}
            <div className="space-y-4">
                {Object.entries(groupedVideos).map(([sectionName, sectionVideos]) => {
                    const isExpanded = expandedSections[sectionName]
                    const progress = getSectionProgress(sectionVideos)

                    return (
                        <div key={sectionName} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(sectionName)}
                                className={`w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${compact ? 'px-4 py-3' : 'px-6 py-4'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {sectionName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {sectionVideos.length} lessons • {progress.completed}/{progress.total} completed
                                        </p>
                                    </div>
                                </div>

                                {/* Section Progress */}
                                <div className="flex items-center space-x-3">
                                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div
                                            className="bg-green-500 rounded-full h-2 transition-all duration-300"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {Math.round(progress.percentage)}%
                                    </span>
                                </div>
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                    {sectionVideos.map((video) => (
                                        <div
                                            key={video.id}
                                            className={`flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${compact ? 'space-x-3 px-4 py-3' : 'space-x-4 px-6 py-4'} ${video.id === currentVideoId ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : ''}`}
                                        >
                                            {/* Completion Checkbox */}
                                            <button
                                                onClick={() => toggleVideoCompletion(video)}
                                                className="flex-shrink-0"
                                            >
                                                {video.completed ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-400 hover:text-green-500 transition-colors" />
                                                )}
                                            </button>

                                            {/* Status Indicator */}
                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${video.completed ? 'bg-green-500' : video.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />



                                            {/* Video Info */}
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => handleVideoClick(video)}
                                                    className="text-left w-full group"
                                                >
                                                    <h4 className={`font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate ${compact ? 'text-sm' : ''}`}>
                                                        {video.title}
                                                    </h4>
                                                    <div className={`flex items-center space-x-2 mt-1 text-gray-500 dark:text-gray-400 ${compact ? 'text-xs space-x-2' : 'text-sm space-x-3'}`}>
                                                        <div className="flex items-center space-x-1">
                                                            <User className="w-4 h-4" />
                                                            <span>{video.instructor}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{video.duration}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Star className="w-4 h-4 text-yellow-500" />
                                                            <span>{video.rating}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Play Button */}
                                            <button
                                                onClick={() => handleVideoClick(video)}
                                                className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                            >
                                                <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default CourseLayout 