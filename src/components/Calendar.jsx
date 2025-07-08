import React from 'react'
import { Calendar as CalendarIcon, Flame, Award } from 'lucide-react'

const Calendar = ({ dailyActivity }) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get first day of month and number of days in month
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    // Calculate current streak
    const calculateStreak = () => {
        const dates = Object.keys(dailyActivity).sort().reverse()
        let streak = 0
        let currentDate = new Date()

        for (let i = 0; i < dates.length; i++) {
            const dateStr = new Date(currentDate).toISOString().split('T')[0]
            if (dates.includes(dateStr)) {
                streak++
                currentDate.setDate(currentDate.getDate() - 1)
            } else {
                break
            }
        }

        return streak
    }

    // Get activity level for a date
    const getActivityLevel = (date) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
        const activity = dailyActivity[dateStr] || 0

        if (activity === 0) return 'bg-gray-100 dark:bg-gray-700'
        if (activity === 1) return 'bg-green-300 dark:bg-green-300'
        if (activity === 2) return 'bg-green-400 dark:bg-green-400'
        if (activity === 3) return 'bg-green-500 dark:bg-green-500'
        if (activity === 4) return 'bg-green-600 dark:bg-green-600'
        if (activity >= 5) return 'bg-green-800 dark:bg-green-800'
        return 'bg-green-500 dark:bg-green-500'
    }

    // Check if date is today
    const isToday = (date) => {
        return date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
    }

    // Check if date has activity
    const hasActivity = (date) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
        return dailyActivity[dateStr] > 0
    }

    const currentStreak = calculateStreak()
    const totalActiveDays = Object.keys(dailyActivity).length

    // Create calendar days array
    const calendarDays = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Learning Calendar
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {monthNames[currentMonth]} {currentYear}
                    </p>
                </div>
            </div>

            {/* Stats - Very Compact */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded p-2 text-white">
                    <div className="flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <div>
                            <p className="text-xs opacity-90">Streak</p>
                            <p className="text-sm font-bold">{currentStreak}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded p-2 text-white">
                    <div className="flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <div>
                            <p className="text-xs opacity-90">Active</p>
                            <p className="text-sm font-bold">{totalActiveDays}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid - Very Compact */}
            <div className="space-y-1">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0.5">
                    {dayNames.map((day, index) => (
                        <div key={`day-${index}`} className="w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((day, index) => (
                        <div
                            key={index}
                            className={`
                                w-6 h-6 flex items-center justify-center text-xs rounded transition-all duration-200
                                ${day === null ? '' :
                                    isToday(day) ?
                                        'ring-1 ring-primary-500 ' + getActivityLevel(day) :
                                        getActivityLevel(day)
                                }
                                ${day && hasActivity(day) ? 'text-white font-medium' : 'text-gray-700 dark:text-gray-300'}
                                ${day ? 'hover:scale-110 cursor-pointer' : ''}
                            `}
                            title={day ?
                                `${monthNames[currentMonth]} ${day}, ${currentYear}${hasActivity(day) ? ' - Active day!' : ''}` :
                                ''
                            }
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Legend - Very Compact */}
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">0</span>
                    <div className="flex space-x-0.5">
                        <div className="w-2 h-2 rounded-sm bg-gray-100 dark:bg-gray-700"></div>
                        <div className="w-2 h-2 rounded-sm bg-green-300 dark:bg-green-300"></div>
                        <div className="w-2 h-2 rounded-sm bg-green-400 dark:bg-green-400"></div>
                        <div className="w-2 h-2 rounded-sm bg-green-500 dark:bg-green-500"></div>
                        <div className="w-2 h-2 rounded-sm bg-green-600 dark:bg-green-600"></div>
                        <div className="w-2 h-2 rounded-sm bg-green-800 dark:bg-green-800"></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">5+</span>
                </div>
            </div>
        </div>
    )
}

export default Calendar 