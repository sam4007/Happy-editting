import React from 'react'
import { Target, TrendingUp, Award, Lightbulb, Calendar, CheckCircle, Star, Clock, Play, BookOpen } from 'lucide-react'

const LearningInsights = ({ dailyActivity, completedVideos, totalVideos, watchHistory = [], favorites = [] }) => {

    // Calculate today's activity
    const getTodaysActivity = () => {
        const today = new Date().toISOString().split('T')[0]
        return dailyActivity?.[today] || 0
    }

    // Calculate this week's activity with proper date handling
    const calculateThisWeekActivity = () => {
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

        let thisWeekCount = 0

        Object.entries(dailyActivity || {}).forEach(([dateStr, count]) => {
            try {
                const activityDate = new Date(dateStr + 'T00:00:00')
                if (activityDate >= weekAgo && activityDate <= today) {
                    // Ensure count is reasonable (max 15 per day)
                    const safeCount = Math.min(Math.max(0, parseInt(count) || 0), 15)
                    thisWeekCount += safeCount
                }
            } catch (error) {
                console.warn('Invalid date in daily activity:', dateStr)
            }
        })

        return Math.min(thisWeekCount, 50) // Cap at 50 per week
    }

    // Calculate learning momentum (activity in last 3 days)
    const calculateLearningMomentum = () => {
        const today = new Date()
        let momentum = 0

        for (let i = 0; i < 3; i++) {
            const checkDate = new Date(today)
            checkDate.setDate(checkDate.getDate() - i)
            const dateStr = checkDate.toISOString().split('T')[0]
            momentum += dailyActivity?.[dateStr] || 0
        }

        return Math.min(momentum, 20) // Cap at reasonable number
    }

    // Calculate study streak
    const calculateStreak = () => {
        if (!dailyActivity || Object.keys(dailyActivity).length === 0) return 0

        const sortedDates = Object.keys(dailyActivity)
            .filter(date => (dailyActivity[date] || 0) > 0)
            .sort((a, b) => new Date(b) - new Date(a))

        if (sortedDates.length === 0) return 0

        let streak = 0
        const today = new Date()
        let checkDate = new Date(today)

        // Allow for today or yesterday as starting point
        const latestActivity = new Date(sortedDates[0] + 'T00:00:00')
        const daysSinceLatest = Math.floor((today - latestActivity) / (24 * 60 * 60 * 1000))

        if (daysSinceLatest > 1) return 0

        // Count consecutive days
        for (let i = 0; i < 30; i++) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (dailyActivity[dateStr] && dailyActivity[dateStr] > 0) {
                streak++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }
        }

        return streak
    }

    const todaysActivity = getTodaysActivity()
    const thisWeekActivity = calculateThisWeekActivity()
    const momentum = calculateLearningMomentum()
    const currentStreak = calculateStreak()
    const weeklyGoal = 7 // 1 video per day goal
    const goalProgress = Math.min((thisWeekActivity / weeklyGoal) * 100, 100)
    const completionRate = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0

    // Enhanced learning tips based on user's current status
    const getLearningTip = () => {
        const tips = {
            noActivity: "Start with just one video today to build momentum!",
            lowActivity: "Try to watch at least one video daily for better retention.",
            goodStreak: "Great streak! Keep the momentum going with consistent daily learning.",
            highCompletion: "Excellent progress! Consider exploring new topics to expand your skills.",
            manyFavorites: "You have great content saved! Revisit your favorites to reinforce learning.",
            recentWatcher: "You're actively learning! Take notes to maximize retention.",
            default: "Set a daily goal of 1-2 videos for consistent progress."
        }

        if (todaysActivity === 0 && thisWeekActivity === 0) return tips.noActivity
        if (currentStreak >= 3) return tips.goodStreak
        if (completionRate >= 80) return tips.highCompletion
        if (favorites.length >= 5) return tips.manyFavorites
        if (thisWeekActivity >= 5) return tips.recentWatcher
        if (thisWeekActivity < 3) return tips.lowActivity
        return tips.default
    }

    // Dynamic achievements based on real engagement
    const achievements = [
        {
            icon: Play,
            title: "First Step",
            unlocked: thisWeekActivity >= 1,
            color: "text-blue-500",
            description: "Watched your first video this week"
        },
        {
            icon: Target,
            title: "Consistent Learner",
            unlocked: currentStreak >= 3,
            color: "text-green-500",
            description: "3+ day learning streak"
        },
        {
            icon: Award,
            title: "Weekly Champion",
            unlocked: thisWeekActivity >= weeklyGoal,
            color: "text-purple-500",
            description: "Met your weekly goal"
        },
        {
            icon: Star,
            title: "Completion Master",
            unlocked: completedVideos >= 5,
            color: "text-yellow-500",
            description: "Completed 5+ videos"
        }
    ]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
                <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Learning Insights
                </h3>
            </div>

            {/* Weekly Goal Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Weekly Goal</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {thisWeekActivity}/{weeklyGoal}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goalProgress}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {goalProgress >= 100 ? "🎉 Goal achieved!" : `${Math.round(goalProgress)}% complete`}
                </p>
            </div>

            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Today's Activity */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 text-white">
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <div>
                            <p className="text-xs opacity-90">Today</p>
                            <p className="text-lg font-bold">{todaysActivity}</p>
                        </div>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 text-white">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <div>
                            <p className="text-xs opacity-90">Completed</p>
                            <p className="text-lg font-bold">{completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Learning Momentum */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Learning Momentum</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {momentum} in 3 days
                    </span>
                </div>
                {currentStreak > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        🔥 {currentStreak} day streak
                    </p>
                )}
            </div>

            {/* Achievements */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Achievements</h4>
                <div className="grid grid-cols-2 gap-2">
                    {achievements.map((achievement, index) => (
                        <div
                            key={index}
                            className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all duration-200 ${achievement.unlocked
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                                }`}
                            title={achievement.description}
                        >
                            <achievement.icon
                                className={`w-4 h-4 ${achievement.unlocked
                                    ? achievement.color
                                    : 'text-gray-400 dark:text-gray-500'
                                    }`}
                            />
                            <span
                                className={`text-xs font-medium ${achievement.unlocked
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                {achievement.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dynamic Learning Tip */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            💡 Learning Tip
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-200">
                            {getLearningTip()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LearningInsights 