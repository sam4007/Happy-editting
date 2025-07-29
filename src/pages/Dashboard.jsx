import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    ChevronRight,
    Plus,
    Settings
} from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import { useAuth } from '../contexts/AuthContext'
import VideoCard from '../components/VideoCard'
import AddVideoModal from '../components/AddVideoModal'
import CourseImporter from '../components/CourseImporter'
import { calculateCurrentStreak, getStreakMessage } from '../utils/streakCalculator'
import { db } from '../config/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const Dashboard = () => {
    const {
        videos,
        favorites,
        watchHistory,
        notes,
        bookmarks,
        recentActivities,
        dailyActivity,
        dailyCompletedVideos
    } = useVideo()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [showAddModal, setShowAddModal] = useState(false)
    const [showCourseImporter, setShowCourseImporter] = useState(false)
    const [currentCourseIndex, setCurrentCourseIndex] = useState(0)
    const [weeklyGoal, setWeeklyGoal] = useState(5)
    const [showGoalModal, setShowGoalModal] = useState(false)
    const [tempGoal, setTempGoal] = useState(5)
    const [isLoadingGoal, setIsLoadingGoal] = useState(true)

    // Touch/Swipe state for mobile
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50

    // Load weekly goal from Firestore
    useEffect(() => {
        const loadWeeklyGoal = async () => {
            if (!user) {
                setIsLoadingGoal(false)
                return
            }

            try {
                const userRef = doc(db, 'users', user.uid)
                const userDoc = await getDoc(userRef)

                if (userDoc.exists() && userDoc.data().weeklyGoal) {
                    const goal = userDoc.data().weeklyGoal
                    setWeeklyGoal(goal)
                    setTempGoal(goal)
                    setIsLoadingGoal(false)
                } else {
                    // New user, show goal setting modal
                    setShowGoalModal(true)
                    setIsLoadingGoal(false)
                }
            } catch (error) {
                console.error('Error loading weekly goal:', error)
                setIsLoadingGoal(false)
            }
        }

        loadWeeklyGoal()
    }, [user])

    // Save weekly goal to Firestore
    const saveWeeklyGoal = async (goal) => {
        if (!user) return

        try {
            const userRef = doc(db, 'users', user.uid)
            await setDoc(userRef, { weeklyGoal: goal }, { merge: true })
            console.log('Weekly goal saved:', goal)
        } catch (error) {
            console.error('Error saving weekly goal:', error)
        }
    }

    const handleSaveGoal = async () => {
        setWeeklyGoal(tempGoal)
        await saveWeeklyGoal(tempGoal)
        setShowGoalModal(false)
    }

    const openGoalSettings = () => {
        setTempGoal(weeklyGoal)
        setShowGoalModal(true)
    }

    // Calculate videos watched for this week
    const getThisWeekVideosWatched = () => {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 7 : today.getDay()) + 1) // Monday

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday

        let totalVideos = 0
        const current = new Date(startOfWeek)

        while (current <= endOfWeek) {
            const dateStr = current.toISOString().split('T')[0]
            totalVideos += dailyCompletedVideos[dateStr] ? dailyCompletedVideos[dateStr].length : 0
            current.setDate(current.getDate() + 1)
        }

        return totalVideos
    }

    const thisWeekVideosWatched = getThisWeekVideosWatched()
    const weeklyProgress = Math.min((thisWeekVideosWatched / weeklyGoal) * 100, 100)

    // Calculate statistics
    const totalVideos = videos.length
    const completedVideos = videos.filter(v => v.completed).length
    const favoriteVideos = favorites
        .slice(0, 5)
        .map(id => videos.find(v => v.id === id))
        .filter(Boolean) // Remove any undefined videos
    const recentVideos = watchHistory
        .slice(0, 5)
        .map(id => videos.find(v => v.id === id))
        .filter(Boolean) // Remove any undefined videos

    // Get recent activities (limit to 8 most recent)
    const recentActivityList = recentActivities.slice(0, 8)

    // Helper function to format activity display
    const getActivityDisplay = (activity) => {
        const timeAgo = new Date(activity.timestamp).toLocaleString()

        switch (activity.type) {
            case 'video_watched':
                return {
                    icon: <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
                    title: `Watched "${activity.videoTitle}"`,
                    subtitle: `${activity.instructor} • ${activity.duration}`,
                    time: timeAgo,
                    bgColor: 'from-indigo-100 to-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20',
                    hoverColor: 'group-hover:from-indigo-200 group-hover:to-indigo-300 dark:group-hover:from-indigo-800/30 dark:group-hover:to-indigo-700/30'
                }
            case 'video_completed':
                return {
                    icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />,
                    title: `Completed "${activity.videoTitle}"`,
                    subtitle: `${activity.instructor} • ${activity.category}`,
                    time: timeAgo,
                    bgColor: 'from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20',
                    hoverColor: 'group-hover:from-green-200 group-hover:to-green-300 dark:group-hover:from-green-800/30 dark:group-hover:to-green-700/30'
                }
            case 'video_progress':
                return {
                    icon: <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
                    title: `${activity.milestone}% progress on "${activity.videoTitle}"`,
                    subtitle: `${activity.instructor} • ${activity.category}`,
                    time: timeAgo,
                    bgColor: 'from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20',
                    hoverColor: 'group-hover:from-blue-200 group-hover:to-blue-300 dark:group-hover:from-blue-800/30 dark:group-hover:to-blue-700/30'
                }
            case 'favorite_added':
                return {
                    icon: <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
                    title: `Added "${activity.videoTitle}" to favorites`,
                    subtitle: `${activity.instructor} • ${activity.category}`,
                    time: timeAgo,
                    bgColor: 'from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20',
                    hoverColor: 'group-hover:from-yellow-200 group-hover:to-yellow-300 dark:group-hover:from-yellow-800/30 dark:group-hover:to-yellow-700/30'
                }
            case 'note_added':
                return {
                    icon: <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
                    title: `Added note to "${activity.videoTitle}"`,
                    subtitle: `"${activity.notePreview}"`,
                    time: timeAgo,
                    bgColor: 'from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20',
                    hoverColor: 'group-hover:from-purple-200 group-hover:to-purple-300 dark:group-hover:from-purple-800/30 dark:group-hover:to-purple-700/30'
                }
            case 'bookmark_added':
                return {
                    icon: <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
                    title: `Bookmarked "${activity.bookmarkTitle}"`,
                    subtitle: `in "${activity.videoTitle}"`,
                    time: timeAgo,
                    bgColor: 'from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20',
                    hoverColor: 'group-hover:from-orange-200 group-hover:to-orange-300 dark:group-hover:from-orange-800/30 dark:group-hover:to-orange-700/30'
                }
            case 'playlist_imported':
                return {
                    icon: <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
                    title: `Imported "${activity.playlistName}"`,
                    subtitle: `${activity.videoCount} videos • ${activity.instructor}`,
                    time: timeAgo,
                    bgColor: 'from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20',
                    hoverColor: 'group-hover:from-emerald-200 group-hover:to-emerald-300 dark:group-hover:from-emerald-800/30 dark:group-hover:to-emerald-700/30'
                }
            default:
                return {
                    icon: <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                    title: 'Recent activity',
                    subtitle: activity.type,
                    time: timeAgo,
                    bgColor: 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800',
                    hoverColor: 'group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700'
                }
        }
    }

    // Helper function to get relative time
    const getRelativeTime = (timestamp) => {
        const now = new Date()
        const activityTime = new Date(timestamp)
        const diffMs = now - activityTime
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return activityTime.toLocaleDateString()
    }

    // Handle activity click - navigate to relevant video or page
    const handleActivityClick = (activity) => {
        if (activity.videoId) {
            // For now, just navigate to library - in future could navigate to specific video
            window.location.href = '/library'
        }
    }

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
                Object.entries(categoryGroups).forEach(([courseKey, courseVideos]) => {
                    const [inst, cat] = courseKey.split(' - ')
                    courses.push({
                        name: `${cat} by ${inst}`,
                        instructor: inst,
                        category: cat,
                        videos: courseVideos
                    })
                })
            } else {
                // Single category, use instructor name as course name
                courses.push({
                    name: `${instructor} Course`,
                    instructor: instructor,
                    category: instructorVideos[0]?.category || 'General',
                    videos: instructorVideos
                })
            }
        })

        return courses.sort((a, b) => b.videos.length - a.videos.length)
    }

    const allCourses = getAllCourses()
    const currentCourse = allCourses[currentCourseIndex] || null

    // Calculate course progress
    const calculateCourseProgress = (course) => {
        if (!course || !course.videos.length) {
            return { totalDuration: 0, completedDuration: 0, completedVideos: 0, totalVideos: 0, percentage: 0 }
        }

        let totalDuration = 0
        let completedDuration = 0
        let completedVideos = 0

        course.videos.forEach(video => {
            const duration = durationToMinutes(video.duration)
            totalDuration += duration

            if (video.completed) {
                completedDuration += duration
                completedVideos++
            } else if (video.progress > 0) {
                completedDuration += duration * (video.progress / 100)
            }
        })

        const percentage = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0

        return {
            totalDuration: Math.round(totalDuration),
            completedDuration: Math.round(completedDuration),
            completedVideos,
            totalVideos: course.videos.length,
            percentage: Math.min(percentage, 100)
        }
    }

    const courseProgress = calculateCourseProgress(currentCourse)

    // Convert minutes to readable format
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = Math.floor(minutes % 60)
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    // Navigation functions for course carousel
    const nextCourse = () => {
        if (currentCourseIndex < allCourses.length - 1) {
            setCurrentCourseIndex(currentCourseIndex + 1)
        } else {
            setCurrentCourseIndex(0) // Loop back to first
        }
    }

    const prevCourse = () => {
        if (currentCourseIndex > 0) {
            setCurrentCourseIndex(currentCourseIndex - 1)
        } else {
            setCurrentCourseIndex(allCourses.length - 1) // Loop to last
        }
    }

    // Touch handlers for swipe functionality
    const onTouchStart = (e) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

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

    // Function to find the first uncompleted video in the course
    const getNextVideoToPlay = (course) => {
        if (!course || !course.videos || course.videos.length === 0) {
            console.log('🎬 No course or videos available')
            return null
        }

        // Use the videos in their original array order (serial numbers are based on array index)
        const courseVideos = [...course.videos]

        console.log('🎬 Course videos in order:', courseVideos.map((v, index) => ({
            serialNumber: index + 1,
            title: v.title,
            completed: v.completed
        })))

        // Find the first video that is NOT completed
        const firstUncompletedVideo = courseVideos.find(video => !video.completed)

        if (firstUncompletedVideo) {
            const videoIndex = courseVideos.indexOf(firstUncompletedVideo)
            console.log('🎬 Found first uncompleted video:', firstUncompletedVideo.title, `(Serial #${videoIndex + 1})`)
            return firstUncompletedVideo
        } else {
            console.log('🎬 All videos completed, restarting from first video:', courseVideos[0].title, '(Serial #1)')
            return courseVideos[0]
        }
    }

    // Handler for "Start where you left" button
    const handleStartWhereYouLeft = () => {
        const course = allCourses[currentCourseIndex]
        const nextVideo = getNextVideoToPlay(course)

        if (nextVideo) {
            navigate(`/video/${nextVideo.id}`)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent">
            {/* Premium Fixed Black Background */}
            <div className="fixed inset-0 z-0">
                {/* Pitch Black Background */}
                <div className="absolute inset-0 bg-black"></div>

                {/* Subtle Texture for Premium Feel */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
                        radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
                    `,
                    backgroundSize: '30px 30px, 50px 50px'
                }}></div>

                {/* Light Mode Override */}
                <div className="absolute inset-0 bg-white dark:bg-transparent"></div>
            </div>

            {/* Main Dashboard Content */}
            <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
                {/* Welcome Header */}
                <div className="mb-12">
                    <h1 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-none">
                        Welcome back!
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">
                        Here's your learning progress overview
                    </p>
                </div>

                {/* Course Progress Card */}
                {allCourses.length > 0 && (
                    <div className="mb-8">
                        <div
                            className="glass-card-frosted p-8 group relative overflow-hidden cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* Course Navigation Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Progress</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {currentCourseIndex + 1} of {allCourses.length} courses • Swipe to navigate
                                        </p>
                                    </div>
                                </div>

                                {allCourses.length > 1 && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={prevCourse}
                                            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                            disabled={allCourses.length <= 1}
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={nextCourse}
                                            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                            disabled={allCourses.length <= 1}
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {currentCourse && (
                                <div className="space-y-6">
                                    {/* Course Info */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                                {currentCourse.name}
                                            </h4>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span>{currentCourse.instructor}</span>
                                                <span>•</span>
                                                <span>{currentCourse.category}</span>
                                                <span>•</span>
                                                <span>{currentCourse.videos.length} videos</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                {courseProgress.percentage}%
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                completed
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Stats */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center p-4 rounded-xl bg-black/5 dark:bg-white/5">
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatDuration(courseProgress.completedDuration)} / {formatDuration(courseProgress.totalDuration)}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Watch Time</div>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-black/5 dark:bg-white/5">
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {courseProgress.completedVideos}/{courseProgress.totalVideos}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Videos Completed</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>Course Progress</span>
                                            <span>{courseProgress.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${courseProgress.percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Continue Learning Button */}
                                    {getNextVideoToPlay(currentCourse) && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleStartWhereYouLeft}
                                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg group"
                                            >
                                                <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                                                <span>Start where you left</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Course Navigation Dots */}
                                    {allCourses.length > 1 && (
                                        <div className="flex justify-center space-x-2 mt-6">
                                            {allCourses.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentCourseIndex(index)}
                                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentCourseIndex
                                                        ? 'bg-indigo-500 w-6'
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Videos */}
                    <div className="glass-card-frosted p-6 group hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                                {totalVideos}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Videos</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% from last week</p>
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="glass-card-frosted p-6 group hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                                {completedVideos}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+8% from last week</p>
                        </div>
                    </div>

                    {/* Watch Time */}
                    <div className="glass-card-frosted p-6 group hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                                {formatDuration(courseProgress.completedDuration)}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Watch Time</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+15% from last week</p>
                        </div>
                    </div>

                    {/* Day Streak */}
                    <div className="glass-card-frosted p-6 group hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <Award className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                                {calculateCurrentStreak(dailyActivity)}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                {getStreakMessage(calculateCurrentStreak(dailyActivity))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Weekly Progress & Goals */}
                    <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Target className="w-5 h-5 text-green-500" />
                                <span>Weekly Progress</span>
                            </h3>
                            <Link
                                to="/analytics"
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium transition-colors"
                            >
                                View Details
                            </Link>
                        </div>

                        {/* Weekly Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {Math.round(weeklyProgress)}%
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    Weekly Progress
                                </div>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {completedVideos}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    Videos Completed
                                </div>
                            </div>
                        </div>

                        {/* Weekly Goal Progress */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Goal</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{weeklyGoal} videos</span>
                                    <button
                                        onClick={openGoalSettings}
                                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        title="Change weekly goal"
                                    >
                                        <Settings className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${weeklyProgress}%` }}
                                />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {thisWeekVideosWatched} of {weeklyGoal} videos completed this week
                            </div>
                        </div>

                        {/* Daily Streak */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20">
                            <div className="flex items-center space-x-2">
                                <Award className="w-5 h-5 text-orange-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Streak</span>
                            </div>
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {calculateCurrentStreak()} days
                            </div>
                        </div>
                    </div>

                    {/* Favorites */}
                    <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                <span>Favorites</span>
                            </h3>
                            <Link
                                to="/library?filter=favorites"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {favoriteVideos.length > 0 ? (
                                favoriteVideos.map((video) => (
                                    <div
                                        key={video.id}
                                        onClick={() => navigate(`/video/${video.id}`)}
                                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <div className="w-12 h-8 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-yellow-200 group-hover:to-yellow-300 dark:group-hover:from-yellow-800/30 dark:group-hover:to-yellow-700/30 transition-all">
                                            <Star className="w-4 h-4 text-yellow-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                                {video.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {video.instructor} • {video.duration}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Star className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No favorites yet
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card-frosted p-8 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-200/50 dark:border-indigo-800/50 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Ready to learn something new?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Discover new lectures and expand your knowledge
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    to="/library"
                                    className="btn-primary"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Browse Library
                                </Link>
                                <button
                                    onClick={() => setShowCourseImporter(true)}
                                    className="btn-secondary"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Import Course
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn-secondary"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Video
                                </button>
                            </div>
                        </div>
                        <div className="hidden lg:block ml-8">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                                <Award className="w-12 h-12 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <AddVideoModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                />

                <CourseImporter
                    isOpen={showCourseImporter}
                    onClose={() => setShowCourseImporter(false)}
                />

                {/* Weekly Goal Setting Modal */}
                {showGoalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGoalModal(false)} />
                        <div className="glass-card-frosted p-8 max-w-md w-full relative">
                            <div className="text-center mb-6">
                                <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Set Your Weekly Learning Goal
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Choose how many videos you want to complete each week
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Weekly Goal (videos)
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">-</span>
                                        </button>
                                        <div className="flex-1 text-center">
                                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                {tempGoal}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setTempGoal(tempGoal + 1)}
                                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">+</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                                            {Math.round((thisWeekVideosWatched / tempGoal) * 100)}%
                                        </div>
                                        <div className="text-sm text-green-600 dark:text-green-400">
                                            Current Progress
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowGoalModal(false)}
                                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveGoal}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Save Goal
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

export default Dashboard 