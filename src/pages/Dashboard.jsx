import React, { useState, useEffect } from 'react'
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
    PlayCircle,
    ChevronLeft,
    ChevronRight
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
    const [currentCourseIndex, setCurrentCourseIndex] = useState(0)
    
    // Touch/Swipe state for mobile
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)
    
    // Minimum swipe distance (in px)
    const minSwipeDistance = 50

    // Debug videos on load
    useEffect(() => {
        if (videos.length > 0) {
            console.log('🔍 Dashboard: Total videos loaded:', videos.length)
            console.log('🔍 Dashboard: Sample video data:', videos[0])
            console.log('🔍 Dashboard: Instructors found:', [...new Set(videos.map(v => v.instructor))])
            console.log('🔍 Dashboard: Categories found:', [...new Set(videos.map(v => v.category))])
            console.log('🔍 Dashboard: Videos with progress > 0:', videos.filter(v => v.progress > 0).length)
            console.log('🔍 Dashboard: Completed videos:', videos.filter(v => v.completed).length)
        }
    }, [videos])

    // Calculate statistics
    const totalVideos = videos.length
    const completedVideos = videos.filter(v => v.completed).length

    // Helper function to convert duration string to minutes
    const durationToMinutes = (duration) => {
        if (!duration) return 0
        try {
            const parts = duration.split(':').map(Number)
            if (parts.length === 2) {
                return parts[0] + (parts[1] / 60) // MM:SS
            } else if (parts.length === 3) {
                return (parts[0] * 60) + parts[1] + (parts[2] / 60) // HH:MM:SS
            }
            return 0
        } catch (error) {
            console.warn('Could not parse duration:', duration)
            return 0
        }
    }

    // Get all courses/playlists from videos
    const getAllCourses = () => {
        const courses = []
        
        // Group videos by instructor first
        const instructorGroups = {}
        videos.forEach(video => {
            const instructor = video.instructor || 'Unknown Instructor'
            if (!instructorGroups[instructor]) {
                instructorGroups[instructor] = []
            }
            instructorGroups[instructor].push(video)
        })

        // Create course objects for each instructor group
        Object.entries(instructorGroups).forEach(([instructor, instructorVideos]) => {
            // Further group by category within each instructor
            const categoryGroups = {}
            instructorVideos.forEach(video => {
                const category = video.category || 'General'
                const courseKey = `${instructor} - ${category}`
                if (!categoryGroups[courseKey]) {
                    categoryGroups[courseKey] = []
                }
                categoryGroups[courseKey].push(video)
            })

            // If instructor has multiple categories, create separate courses
            if (Object.keys(categoryGroups).length > 1) {
                Object.entries(categoryGroups).forEach(([courseKey, categoryVideos]) => {
                    courses.push({
                        name: courseKey,
                        instructor,
                        category: courseKey.split(' - ')[1],
                        videos: categoryVideos,
                        videoCount: categoryVideos.length
                    })
                })
            } else {
                // Single category, use instructor name as course name
                courses.push({
                    name: `${instructor} Course`,
                    instructor,
                    category: instructorVideos[0]?.category || 'General',
                    videos: instructorVideos,
                    videoCount: instructorVideos.length
                })
            }
        })

        // Sort courses by video count (largest first)
        courses.sort((a, b) => b.videoCount - a.videoCount)

        // If no courses found, create a default "All Videos" course
        if (courses.length === 0 && videos.length > 0) {
            courses.push({
                name: 'All Videos',
                instructor: 'Mixed',
                category: 'General',
                videos: videos,
                videoCount: videos.length
            })
        }

        console.log('📚 All Courses Found:', courses.map(c => `${c.name} (${c.videoCount} videos)`))
        return courses
    }

    const allCourses = getAllCourses()
    const currentCourse = allCourses[currentCourseIndex] || null

    // Calculate progress for current course
    const calculateCourseProgress = (course) => {
        if (!course || !course.videos.length) {
            return {
                totalDuration: 0,
                completedDuration: 0,
                progressPercentage: 0,
                completedVideos: 0,
                totalVideos: 0
            }
        }

        const totalDuration = course.videos.reduce((acc, video) => {
            return acc + durationToMinutes(video.duration)
        }, 0)

        const completedDuration = course.videos.reduce((acc, video) => {
            if (video.completed) {
                return acc + durationToMinutes(video.duration)
            } else if (video.progress > 0) {
                return acc + (durationToMinutes(video.duration) * (video.progress / 100))
            }
            return acc
        }, 0)

        const completedVideosCount = course.videos.filter(v => v.completed).length
        const progressPercentage = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0

        return {
            totalDuration,
            completedDuration,
            progressPercentage,
            completedVideos: completedVideosCount,
            totalVideos: course.videos.length
        }
    }

    const courseProgress = calculateCourseProgress(currentCourse)

    // Format time as hours and minutes
    const formatDuration = (totalMinutes) => {
        if (totalMinutes < 1) return '0m'
        const hours = Math.floor(totalMinutes / 60)
        const minutes = Math.round(totalMinutes % 60)
        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
        }
        return `${minutes}m`
    }

    // Course navigation functions
    const nextCourse = () => {
        setCurrentCourseIndex((prevIndex) => 
            prevIndex === allCourses.length - 1 ? 0 : prevIndex + 1
        )
    }

    const prevCourse = () => {
        setCurrentCourseIndex((prevIndex) => 
            prevIndex === 0 ? allCourses.length - 1 : prevIndex - 1
        )
    }

    // Touch event handlers for swipe functionality
    const onTouchStart = (e) => {
        setTouchEnd(null) // otherwise the swipe is fired even with usual touch events
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe && allCourses.length > 1) {
            nextCourse()
        }
        if (isRightSwipe && allCourses.length > 1) {
            prevCourse()
        }
    }

    // Create watch time display for current course
    const watchTimeDisplay = currentCourse 
        ? `${formatDuration(courseProgress.completedDuration)} / ${formatDuration(courseProgress.totalDuration)}`
        : '0m'

    const courseProgressPercentage = currentCourse ? courseProgress.progressPercentage : 0

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
        // Priority 1: Next video in the same course (using mainCourse logic)
        if (currentCourse?.videos.some(v => v.id === lastWatchedVideo.id)) {
            const sortedCourseVideos = currentCourse.videos.sort((a, b) => a.id - b.id) // Sort by ID to maintain order
            const currentIndex = sortedCourseVideos.findIndex(v => v.id === lastWatchedVideo.id)

            if (currentIndex !== -1 && currentIndex < sortedCourseVideos.length - 1) {
                const nextVideo = sortedCourseVideos[currentIndex + 1]
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

                {/* Course Progress Carousel */}
                {allCourses.length > 0 && (
                    <div className="mb-8">
                        <div 
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden cursor-grab active:cursor-grabbing"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* Course Navigation Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Course Progress
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {currentCourseIndex + 1} of {allCourses.length} courses • Swipe to navigate
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Navigation Buttons */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={prevCourse}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={allCourses.length <= 1}
                                        title="Previous course"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <button
                                        onClick={nextCourse}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={allCourses.length <= 1}
                                        title="Next course"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>
                            </div>

                            {/* Course Progress Content */}
                            {currentCourse && (
                                <div className="space-y-4">
                                    {/* Course Info */}
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {currentCourse.name}
                                        </h4>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{currentCourse.instructor}</span>
                                            <span>•</span>
                                            <span>{currentCourse.category}</span>
                                            <span>•</span>
                                            <span>{courseProgress.totalVideos} videos</span>
                                        </div>
                                    </div>

                                    {/* Progress Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {watchTimeDisplay}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Watch Time
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {courseProgress.completedVideos}/{courseProgress.totalVideos}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Videos Completed
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Course Progress
                                            </span>
                                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                                {courseProgressPercentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${courseProgressPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Course Indicators */}
                                    {allCourses.length > 1 && (
                                        <div className="flex justify-center space-x-2 mt-4">
                                            {allCourses.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentCourseIndex(index)}
                                                    className={`w-2 h-2 rounded-full transition-colors ${
                                                        index === currentCourseIndex
                                                            ? 'bg-purple-500'
                                                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                                    }`}
                                                    title={`Go to ${allCourses[index]?.name}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

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