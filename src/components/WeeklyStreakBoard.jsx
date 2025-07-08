import React from 'react'
import { TrendingUp, Target } from 'lucide-react'

const WeeklyStreakBoard = ({ dailyActivity }) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get weeks in current month
    const getWeeksInMonth = () => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const weeks = []

        let currentWeekStart = new Date(firstDay)
        // Go back to the start of the week (Sunday)
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())

        while (currentWeekStart <= lastDay) {
            const weekEnd = new Date(currentWeekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            weeks.push({
                start: new Date(currentWeekStart),
                end: new Date(weekEnd),
                days: []
            })

            // Add days to this week
            for (let i = 0; i < 7; i++) {
                const day = new Date(currentWeekStart)
                day.setDate(day.getDate() + i)
                weeks[weeks.length - 1].days.push(new Date(day))
            }

            currentWeekStart.setDate(currentWeekStart.getDate() + 7)
        }

        return weeks
    }

    // Calculate weekly stats
    const calculateWeeklyStats = (week) => {
        let activeDays = 0
        let totalVideos = 0

        week.days.forEach(day => {
            // Only count days in current month
            if (day.getMonth() === currentMonth) {
                const dateStr = day.toISOString().split('T')[0]
                const dayActivity = dailyActivity[dateStr] || 0
                if (dayActivity > 0) {
                    activeDays++
                    totalVideos += dayActivity
                }
            }
        })

        return { activeDays, totalVideos }
    }

    // Get week consistency percentage
    const getWeekConsistency = (week) => {
        const { activeDays } = calculateWeeklyStats(week)
        const daysInCurrentMonth = week.days.filter(day => day.getMonth() === currentMonth).length
        return Math.round((activeDays / daysInCurrentMonth) * 100)
    }

    // Format week date range
    const formatWeekRange = (week) => {
        const start = week.start
        const end = week.end
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${startStr} - ${endStr}`
    }

    // Get consistency color
    const getConsistencyColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-500'
        if (percentage >= 60) return 'bg-blue-500'
        if (percentage >= 40) return 'bg-yellow-500'
        if (percentage >= 20) return 'bg-orange-500'
        return 'bg-red-500'
    }

    // Get consistency text
    const getConsistencyText = (percentage) => {
        if (percentage >= 80) return 'Excellent'
        if (percentage >= 60) return 'Good'
        if (percentage >= 40) return 'Fair'
        if (percentage >= 20) return 'Poor'
        return 'Needs Work'
    }

    const weeks = getWeeksInMonth()
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    // Calculate average consistency across all weeks
    const averageConsistency = weeks.length > 0
        ? Math.round(weeks.reduce((acc, week) => acc + getWeekConsistency(week), 0) / weeks.length)
        : 0



    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Weekly Consistency
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {monthNames[currentMonth]} {currentYear}
                    </p>
                </div>
            </div>



            {/* Weekly Breakdown */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Weekly Breakdown
                </h4>

                {weeks.map((week, index) => {
                    const stats = calculateWeeklyStats(week)
                    const consistency = getWeekConsistency(week)
                    const isCurrentWeek = week.days.some(day =>
                        day.toDateString() === today.toDateString()
                    )

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
                                                Week {index + 1}: {formatWeekRange(week)}
                                            </span>
                                            {isCurrentWeek && (
                                                <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span>{stats.activeDays}/7 days active</span>
                                        <span>•</span>
                                        <span>{stats.totalVideos} videos watched</span>
                                        <span>•</span>
                                        <span className={`font-medium ${consistency >= 60 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                            {getConsistencyText(consistency)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {consistency}%
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            consistency
                                        </div>
                                    </div>

                                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${getConsistencyColor(consistency)}`}
                                                style={{ height: `${consistency}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">
                                                    {Math.round(consistency / 10)}
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
                                        className={`h-2 rounded-full transition-all duration-500 ${getConsistencyColor(consistency)}`}
                                        style={{ width: `${consistency}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Tips */}
            {averageConsistency < 50 && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <Target className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Boost Your Consistency!
                            </h5>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Try watching at least one video daily to build a strong learning habit.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WeeklyStreakBoard 