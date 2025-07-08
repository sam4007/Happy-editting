import React, { useState, useEffect } from 'react'
import { TrendingUp, Settings, Target, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useVideo } from '../contexts/VideoContext'
import { db } from '../config/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const WeeklyStreakBoard = () => {
    const { user } = useAuth()
    const { dailyCompletedVideos } = useVideo()
    const [showGoalModal, setShowGoalModal] = useState(false)
    const [weeklyGoal, setWeeklyGoal] = useState(5)
    const [tempGoal, setTempGoal] = useState(5)
    const [isLoading, setIsLoading] = useState(true)

    // Load weekly goal from Firestore
    useEffect(() => {
        const loadWeeklyGoal = async () => {
            if (!user) {
                setIsLoading(false)
                return
            }

            try {
                const userRef = doc(db, 'users', user.uid)
                const userDoc = await getDoc(userRef)

                if (userDoc.exists() && userDoc.data().weeklyGoal) {
                    const goal = userDoc.data().weeklyGoal
                    setWeeklyGoal(goal)
                    setTempGoal(goal)
                    setIsLoading(false)
                } else {
                    // New user, show goal setting modal
                    setShowGoalModal(true)
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('Error loading weekly goal:', error)
                setIsLoading(false)
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

    const openSettingsModal = () => {
        setTempGoal(weeklyGoal)
        setShowGoalModal(true)
    }

    // Calculate videos watched for a specific day
    const getVideosWatchedForDay = (date) => {
        const dateStr = date.toISOString().split('T')[0]
        return dailyCompletedVideos[dateStr] ? dailyCompletedVideos[dateStr].length : 0
    }

    // Calculate videos watched for a specific week
    const getVideosWatchedForWeek = (startDate, endDate) => {
        let totalVideos = 0
        const current = new Date(startDate)

        while (current <= endDate) {
            totalVideos += getVideosWatchedForDay(current)
            current.setDate(current.getDate() + 1)
        }

        return totalVideos
    }

    // Get the last 4 weeks (Monday to Sunday)
    const getLast4Weeks = () => {
        const weeks = []
        const today = new Date()

        for (let i = 3; i >= 0; i--) {
            // Calculate the start of the week for i weeks ago
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 7 : today.getDay()) + 1 - (i * 7)) // Monday

            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6) // Sunday

            weeks.push({
                start: new Date(weekStart),
                end: new Date(weekEnd),
                weekNumber: i === 0 ? 'Current' : `Week ${4 - i}`
            })
        }

        return weeks
    }

    // Format week date range (Mon DD - Sun DD)
    const formatWeekRange = (start, end) => {
        const options = { month: 'short', day: 'numeric' }
        const startStr = start.toLocaleDateString('en-US', options)
        const endStr = end.toLocaleDateString('en-US', options)
        return `${startStr} - ${endStr}`
    }

    // Get progress percentage based on goal
    const getGoalProgress = (videosWatched, goal) => {
        if (!goal || goal === 0) return 0
        return Math.min(Math.round((videosWatched / goal) * 100), 100)
    }

    // Get progress color (red to green transition)
    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-emerald-500'
        if (percentage >= 80) return 'bg-green-500'
        if (percentage >= 60) return 'bg-lime-500'
        if (percentage >= 40) return 'bg-yellow-500'
        if (percentage >= 20) return 'bg-orange-500'
        return 'bg-red-500'
    }

    // Get progress text
    const getProgressText = (percentage) => {
        if (percentage >= 100) return 'Goal Achieved! 🎉'
        if (percentage >= 80) return 'Almost There!'
        if (percentage >= 60) return 'Good Progress'
        if (percentage >= 40) return 'Keep Going'
        if (percentage >= 20) return 'Getting Started'
        return 'Needs Work'
    }

    const weeks = getLast4Weeks()
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    // Show goal setting for new users
    if (showGoalModal) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Set Your Weekly Learning Goal
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        How many video lectures do you plan to complete each week?
                    </p>

                    <div className="flex items-center justify-center space-x-4 mb-6">
                        <button
                            onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">-</span>
                        </button>

                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                                {tempGoal}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                videos per week
                            </div>
                        </div>

                        <button
                            onClick={() => setTempGoal(tempGoal + 1)}
                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">+</span>
                        </button>
                    </div>

                    <button
                        onClick={handleSaveGoal}
                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        Set My Goal
                    </button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        You can change this later in settings
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Weekly Consistency
                    </h3>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {currentDate}
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-400">
                            Goal: {weeklyGoal} videos/week
                        </p>
                    </div>
                    <button
                        onClick={openSettingsModal}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Change weekly goal"
                    >
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Weekly Breakdown */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Weekly Breakdown
                </h4>

                {weeks.map((week, index) => {
                    const videosWatched = getVideosWatchedForWeek(week.start, week.end)
                    const progress = getGoalProgress(videosWatched, weeklyGoal)
                    const isCurrentWeek = week.weekNumber === 'Current'

                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border transition-all duration-200 ${isCurrentWeek
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {week.weekNumber}: {formatWeekRange(week.start, week.end)}
                                            </span>
                                            {isCurrentWeek && (
                                                <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span>{videosWatched}/{weeklyGoal} videos watched</span>
                                        <span>•</span>
                                        <span className={`font-medium ${progress >= 80
                                            ? 'text-green-600 dark:text-green-400'
                                            : progress >= 40
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {getProgressText(progress)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {progress}%
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            completed
                                        </div>
                                    </div>

                                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${getProgressColor(progress)}`}
                                                style={{ height: `${progress}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">
                                                    {videosWatched}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Goal Achievement Tip */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-2">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Weekly Goal Progress
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Stay consistent with your {weeklyGoal} videos per week goal to build a strong learning habit!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WeeklyStreakBoard 