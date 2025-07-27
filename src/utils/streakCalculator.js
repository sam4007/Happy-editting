// Utility functions for calculating learning streaks

/**
 * Calculate current learning streak based on daily activity
 * @param {Object} dailyActivity - Object with date strings as keys and activity counts as values
 * @returns {number} Current consecutive day streak
 */
export const calculateCurrentStreak = (dailyActivity) => {
    if (!dailyActivity || Object.keys(dailyActivity).length === 0) return 0

    const today = new Date()
    let streak = 0

    for (let i = 0; i < 365; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        // Check if there was activity on this day (activity count > 0)
        if (dailyActivity[dateStr] && dailyActivity[dateStr] > 0) {
            streak++
        } else {
            break
        }
    }

    return streak
}

/**
 * Calculate longest learning streak from all-time daily activity
 * @param {Object} dailyActivity - Object with date strings as keys and activity counts as values
 * @returns {number} Longest consecutive day streak ever achieved
 */
export const calculateLongestStreak = (dailyActivity) => {
    if (!dailyActivity || Object.keys(dailyActivity).length === 0) return 0

    const sortedDates = Object.keys(dailyActivity)
        .filter(date => dailyActivity[date] > 0) // Only dates with activity
        .sort()

    if (sortedDates.length === 0) return 0

    let maxStreak = 0
    let currentStreak = 0

    for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i])
        const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null

        if (prevDate && (currentDate - prevDate) === 86400000) { // 24 hours in milliseconds
            currentStreak++
        } else {
            currentStreak = 1
        }

        maxStreak = Math.max(maxStreak, currentStreak)
    }

    return maxStreak
}

/**
 * Get streak status message based on current streak
 * @param {number} streak - Current streak count
 * @returns {string} Encouraging message
 */
export const getStreakMessage = (streak) => {
    if (streak === 0) return "Start your streak today!"
    if (streak === 1) return "Great start!"
    if (streak < 7) return "Keep it up!"
    if (streak < 30) return "Amazing streak!"
    if (streak < 100) return "Incredible dedication!"
    return "You're unstoppable!"
}

/**
 * Check if user was active today
 * @param {Object} dailyActivity - Object with date strings as keys and activity counts as values
 * @returns {boolean} True if user was active today
 */
export const wasActiveToday = (dailyActivity) => {
    const today = new Date().toISOString().split('T')[0]
    return dailyActivity[today] > 0
}

/**
 * Get activity count for today
 * @param {Object} dailyActivity - Object with date strings as keys and activity counts as values
 * @returns {number} Today's activity count
 */
export const getTodayActivityCount = (dailyActivity) => {
    const today = new Date().toISOString().split('T')[0]
    return dailyActivity[today] || 0
} 