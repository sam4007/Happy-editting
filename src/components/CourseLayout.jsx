import React from 'react'
import { CheckCircle, Circle, Play, Clock, Star, User } from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import { useNavigate } from 'react-router-dom'

const CourseLayout = ({ videos, courseName, instructor, compact = false, currentVideoId = null }) => {
    const { updateVideo } = useVideo()
    const navigate = useNavigate()

    // Calculate overall course progress
    const overallProgress = {
        completed: videos.filter(v => v.completed).length,
        total: videos.length,
        percentage: videos.length > 0 ? (videos.filter(v => v.completed).length / videos.length) * 100 : 0
    }

    const toggleVideoCompletion = (video) => {
        console.log('Toggling completion for video:', video.title, 'from', video.completed, 'to', !video.completed)
        updateVideo(video.id, { completed: !video.completed })
    }

    const handleVideoClick = (video) => {
        navigate(`/video/${video.id}`)
    }

    return (
        <div className="space-y-4">
            {/* Course Header */}
            <div className={`bg-gradient-to-br from-primary-500/80 to-primary-600/80 backdrop-blur-md rounded-2xl text-white shadow-xl border border-white/20 ${compact ? 'p-5' : 'p-8'}`}>
                <div className="mb-3">
                    <h2 className={`font-black tracking-tight ${compact ? 'text-xl' : 'text-3xl'} leading-tight`}>
                        {courseName}
                    </h2>
                    {instructor && (
                        <p className={`text-white/80 font-medium mt-1 ${compact ? 'text-sm' : 'text-base'}`}>
                            by {instructor}
                        </p>
                    )}
                </div>
                <div className={`flex items-center ${compact ? 'mb-4' : 'mb-6'}`}>
                    <div className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/30">
                        <span className="text-white font-medium text-xs">{overallProgress.completed}/{overallProgress.total} completed</span>
                    </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 shadow-inner border border-white/30 mb-3">
                    <div
                        className="bg-white rounded-full h-3 transition-all duration-500 shadow-lg"
                        style={{ width: `${overallProgress.percentage}%` }}
                    />
                </div>
                <p className="text-sm text-white font-bold">
                    {Math.round(overallProgress.percentage)}% Complete
                </p>
            </div>

            {/* Video List */}
            <div className="glass-card-frosted overflow-hidden">
                <div className="divide-y divide-white/10 dark:divide-white/5">
                    {videos.map((video, videoIndex) => (
                        <div
                            key={video.id}
                            className={`flex items-center hover:bg-white/10 dark:hover:bg-white/5 backdrop-blur-sm transition-colors duration-200 group cursor-pointer ${compact ? 'gap-3 px-4 py-3' : 'gap-4 px-5 py-4'} ${video.id === currentVideoId ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}
                        >
                            {/* Serial Number */}
                            <div className="flex-shrink-0 w-8 h-8 bg-white/30 dark:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 dark:border-white/10 shadow-sm">
                                <span className={`font-bold text-gray-700 dark:text-gray-200 ${compact ? 'text-xs' : 'text-sm'}`}>
                                    {videoIndex + 1}
                                </span>
                            </div>

                            {/* Completion Checkbox */}
                            <button
                                onClick={() => toggleVideoCompletion(video)}
                                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
                            >
                                {video.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200" />
                                )}
                            </button>

                            {/* Status Indicator */}
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${video.completed ? 'bg-green-500' : video.progress > 0 ? 'bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`} />



                            {/* Video Info */}
                            <div className="flex-1 min-w-0 mr-2">
                                <button
                                    onClick={() => handleVideoClick(video)}
                                    className="text-left w-full group"
                                >
                                    <h4 className={`font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 truncate ${compact ? 'text-sm' : 'text-base'} leading-tight`}>
                                        {video.title}
                                    </h4>
                                    <div className={`flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'} flex-wrap`}>
                                        <div className="flex items-center space-x-1 bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                            <User className="w-3 h-3 flex-shrink-0" />
                                            <span className="font-medium text-xs truncate max-w-16">{video.instructor}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span className="font-medium text-xs">{video.duration}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 bg-yellow-100/50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                            <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                            <span className="font-medium text-yellow-700 dark:text-yellow-300 text-xs">{video.rating}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Play Button */}
                            <button
                                onClick={() => handleVideoClick(video)}
                                className="flex-shrink-0 w-9 h-9 bg-white/30 dark:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 dark:hover:bg-white/25 transition-colors duration-200 border border-white/20 dark:border-white/10"
                            >
                                <Play className="w-4 h-4 text-primary-600 dark:text-primary-400 ml-0.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CourseLayout 