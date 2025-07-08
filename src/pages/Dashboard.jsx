import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    TrendingUp,
    Clock,
    CheckCircle,
    Star,
    Play,
    BookOpen,
    Target,
    Award,
    ArrowRight,
    Download,
    Timer,
    PlayCircle
} from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import VideoCard from '../components/VideoCard'
import AddVideoModal from '../components/AddVideoModal'
import CourseImporter from '../components/CourseImporter'
import CalendarComponent from '../components/Calendar'
import WeeklyStreakBoard from '../components/WeeklyStreakBoard'
import LearningInsights from '../components/LearningInsights'

const Dashboard = () => {
    const { videos, favorites, watchHistory, dailyActivity } = useVideo()
    const [showAddModal, setShowAddModal] = useState(false)
    const [showCourseImporter, setShowCourseImporter] = useState(false)

    // Calculate statistics
    const totalVideos = videos.length
    const completedVideos = videos.filter(v => v.completed).length

    // Calculate Happy Editting course progress
    const happyEdittingVideos = videos.filter(video =>
        video.instructor === 'Happy Editting' &&
        video.category === 'Video Editing'
    )

    // Helper function to convert duration string to minutes
    const durationToMinutes = (duration) => {
        const [minutes, seconds] = duration.split(':').map(Number)
        return minutes + (seconds / 60)
    }

    // Calculate total course duration in minutes
    const totalCourseDuration = happyEdittingVideos.reduce((acc, video) => {
        return acc + durationToMinutes(video.duration)
    }, 0)

    // Calculate completed duration based on progress and completion
    const completedCourseDuration = happyEdittingVideos.reduce((acc, video) => {
        if (video.completed) {
            return acc + durationToMinutes(video.duration)
        } else if (video.progress > 0) {
            return acc + (durationToMinutes(video.duration) * (video.progress / 100))
        }
        return acc
    }, 0)

    // Format time as hours and minutes
    const formatDuration = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = Math.round(totalMinutes % 60)
        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
        }
        return `${minutes}m`
    }

    // Create watch time display
    const watchTimeDisplay = happyEdittingVideos.length > 0
        ? `${formatDuration(completedCourseDuration)} / ${formatDuration(totalCourseDuration)}`
        : `${Math.round(videos.reduce((acc, video) => acc + durationToMinutes(video.duration), 0) / 60)}h`

    // Continue Learning Logic
    const getContinueLearningVideo = () => {
        if (watchHistory.length === 0) {
            // No watch history, return first video
            return videos.length > 0 ? videos[0] : null
        }

        // Get the last watched video
        const lastWatchedId = watchHistory[0]
        const lastWatchedVideo = videos.find(v => v.id === lastWatchedId)

        if (!lastWatchedVideo) {
            return videos.length > 0 ? videos[0] : null
        }

        // If the last watched video is not completed, return it
        if (!lastWatchedVideo.completed) {
            return lastWatchedVideo
        }

        // Last watched video is completed, find the next video
        // Priority 1: Next video in the same course (Happy Editting)
        if (lastWatchedVideo.instructor === 'Happy Editting' && lastWatchedVideo.category === 'Video Editing') {
            const courseVideos = videos
                .filter(v => v.instructor === 'Happy Editting' && v.category === 'Video Editing')
                .sort((a, b) => a.id - b.id) // Sort by ID to maintain order

            const currentIndex = courseVideos.findIndex(v => v.id === lastWatchedVideo.id)

            if (currentIndex !== -1 && currentIndex < courseVideos.length - 1) {
                const nextVideo = courseVideos[currentIndex + 1]
                return nextVideo
            }
        }

        // Priority 2: Next video from the same instructor
        const sameInstructorVideos = videos
            .filter(v => v.instructor === lastWatchedVideo.instructor && !v.completed)
            .sort((a, b) => a.id - b.id)

        if (sameInstructorVideos.length > 0) {
            return sameInstructorVideos[0]
        }

        // Priority 3: Any uncompleted video
        const uncompletedVideos = videos.filter(v => !v.completed).sort((a, b) => a.id - b.id)
        if (uncompletedVideos.length > 0) {
            return uncompletedVideos[0]
        }

        // All videos completed, return the first video for review
        return videos.length > 0 ? videos[0] : null
    }

    const continueVideo = getContinueLearningVideo()

    // Use real daily activity data instead of sample data
    const displayActivity = dailyActivity
    console.log('📅 Real Activity Data:', displayActivity)

    // Get recent videos (last 5 watched)
    const recentVideos = watchHistory.slice(0, 5).map(id => videos.find(v => v.id === id)).filter(Boolean)

    // Get in-progress videos (excluding the featured continue video)
    const inProgressVideos = videos
        .filter(v => v.progress > 0 && !v.completed && v.id !== continueVideo?.id)
        .slice(0, 6)

    // Get favorite videos
    const favoriteVideos = favorites.map(id => videos.find(v => v.id === id)).filter(Boolean).slice(0, 6)

    const stats = [
        {
            title: 'Total Videos',
            value: totalVideos,
            icon: BookOpen,
            color: 'bg-blue-500',
            change: '+12% from last week'
        },
        {
            title: 'Completed',
            value: completedVideos,
            icon: CheckCircle,
            color: 'bg-green-500',
            change: '+8% from last week'
        },
        {
            title: happyEdittingVideos.length > 0 ? 'Course Progress' : 'Watch Time',
            value: watchTimeDisplay,
            icon: Clock,
            color: 'bg-purple-500',
            change: happyEdittingVideos.length > 0 ?
                `${Math.round((completedCourseDuration / totalCourseDuration) * 100)}% completed` :
                '+15% from last week'
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64">
            <div className="p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Here's your learning progress overview
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Calendar and Insights Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                    {/* Left Column - Calendar + Learning Insights */}
                    <div className="xl:col-span-1 space-y-6">
                        <CalendarComponent dailyActivity={displayActivity} />
                        <LearningInsights
                            dailyActivity={displayActivity}
                            completedVideos={completedVideos}
                            totalVideos={totalVideos}
                            watchHistory={watchHistory}
                            favorites={favorites}
                        />
                    </div>

                    {/* Right Column - Weekly Streak Board */}
                    <div className="xl:col-span-2">
                        <WeeklyStreakBoard />
                    </div>
                </div>

                {/* Continue Learning Card - Separate and Well-Organized */}
                {continueVideo && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <PlayCircle className="w-5 h-5" />
                                        <h3 className="text-lg font-semibold">Continue Learning</h3>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2 text-primary-100">
                                            {continueVideo.title}
                                        </h4>
                                        <div className="flex items-center space-x-3 text-primary-200 text-sm">
                                            <span>{continueVideo.instructor}</span>
                                            <span>•</span>
                                            <span>{continueVideo.duration}</span>
                                            <span>•</span>
                                            <span>{continueVideo.category}</span>
                                        </div>
                                        {continueVideo.progress > 0 && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-primary-200">Progress</span>
                                                    <span className="text-xs text-primary-200">{continueVideo.progress}%</span>
                                                </div>
                                                <div className="w-full bg-primary-400 rounded-full h-1.5">
                                                    <div
                                                        className="bg-white rounded-full h-1.5 transition-all duration-300"
                                                        style={{ width: `${continueVideo.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Link
                                            to={`/video/${continueVideo.id}`}
                                            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            <span>
                                                {continueVideo.progress > 0 ? 'Continue Watching' : 'Start Watching'}
                                            </span>
                                        </Link>
                                        <Link
                                            to="/library"
                                            className="bg-primary-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-800 transition-colors"
                                        >
                                            Browse All
                                        </Link>
                                    </div>
                                </div>

                                <div className="hidden md:block ml-6">
                                    <div className="w-20 h-16 bg-primary-400 rounded-lg flex items-center justify-center">
                                        <PlayCircle className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Videos You Started */}
                {inProgressVideos.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Other Videos You Started
                            </h2>
                            <Link
                                to="/library"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center space-x-1"
                            >
                                <span>View All</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inProgressVideos.map((video) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Recently Watched */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                <span>Recently Watched</span>
                            </h3>
                            <Link
                                to="/library"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {recentVideos.length > 0 ? (
                                recentVideos.map((video) => (
                                    <div key={video.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                        <div className="w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                                            <Play className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {video.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {video.instructor} • {video.duration}
                                            </p>
                                        </div>
                                        <Play className="w-4 h-4 text-gray-400" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No recent activity
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Favorites */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                <span>Favorites</span>
                            </h3>
                            <Link
                                to="/library"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {favoriteVideos.length > 0 ? (
                                favoriteVideos.map((video) => (
                                    <div key={video.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                        <div className="w-12 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded flex items-center justify-center flex-shrink-0">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {video.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {video.instructor} • {video.duration}
                                            </p>
                                        </div>
                                        <Star className="w-4 h-4 text-yellow-500" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No favorites yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Ready to learn something new?</h3>
                            <p className="text-primary-100 mb-4">
                                Discover new lectures and expand your knowledge
                            </p>
                            <div className="flex space-x-3">
                                <Link
                                    to="/library"
                                    className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Browse Library
                                </Link>
                                <button
                                    onClick={() => setShowCourseImporter(true)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Import Course</span>
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-primary-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-800 transition-colors"
                                >
                                    Add New Video
                                </button>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <Award className="w-24 h-24 text-primary-200" />
                        </div>
                    </div>
                </div>

                {/* Add Video Modal */}
                <AddVideoModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                />

                {/* Course Importer Modal */}
                <CourseImporter
                    isOpen={showCourseImporter}
                    onClose={() => setShowCourseImporter(false)}
                />
            </div>
        </div>
    )
}

export default Dashboard 