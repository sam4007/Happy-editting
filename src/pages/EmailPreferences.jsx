import React, { useState } from 'react'
import { Mail, Bell, Star, BookOpen, TrendingUp, Shield, Clock, Calendar, Save, Check, AlertCircle, Volume2, VolumeX } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'

const EmailPreferences = () => {
    const { addNotification } = useNotifications()

    const [preferences, setPreferences] = useState({
        // Learning notifications
        courseReminders: true,
        progressUpdates: true,
        newVideoAlerts: true,
        completionCelebrations: true,

        // Achievement notifications
        badgeEarned: true,
        milestoneReached: true,
        streakReminders: true,
        personalBests: true,

        // Social notifications
        friendActivity: false,
        newFollowers: false,
        mentions: true,
        comments: true,

        // Marketing emails
        productUpdates: true,
        newFeatures: true,
        promotionalOffers: false,
        newsletter: true,

        // Security notifications
        loginAlerts: true,
        passwordChanges: true,
        accountUpdates: true,
        suspiciousActivity: true,

        // Administrative
        systemMaintenance: true,
        policyUpdates: true,
        serviceAnnouncements: true,

        // Frequency settings
        summaryFrequency: 'weekly',
        reminderTime: '09:00',
        timeZone: 'UTC-5'
    })

    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const handleToggle = (key) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
        // Clear messages when user makes changes
        if (success) setSuccess('')
        if (error) setError('')
    }

    const handleSelectChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }))
        if (success) setSuccess('')
        if (error) setError('')
    }

    const handleSave = async () => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            // Here you would save preferences to the backend
            await new Promise(resolve => setTimeout(resolve, 1000))

            setSuccess('Email preferences updated successfully!')

            addNotification({
                type: 'update',
                title: 'Preferences Updated',
                message: 'Your email preferences have been saved.',
                icon: '📧'
            })

        } catch (error) {
            setError('Failed to save preferences. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
    )

    const PreferenceItem = ({ icon: Icon, title, description, checked, onChange, disabled = false, color = "blue" }) => {
        const colorClasses = {
            blue: "text-blue-500",
            green: "text-green-500",
            purple: "text-purple-500",
            orange: "text-orange-500",
            red: "text-red-500",
            yellow: "text-yellow-500"
        }

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                    <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {description}
                        </p>
                    </div>
                </div>
                <ToggleSwitch
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Email Preferences
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Customize which emails you receive and how often
                        </p>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
            )}

            {/* Learning Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                    Learning Notifications
                </h2>
                <div className="space-y-4">
                    <PreferenceItem
                        icon={Clock}
                        title="Course Reminders"
                        description="Get reminders to continue your learning journey"
                        checked={preferences.courseReminders}
                        onChange={() => handleToggle('courseReminders')}
                        color="blue"
                    />
                    <PreferenceItem
                        icon={TrendingUp}
                        title="Progress Updates"
                        description="Weekly summaries of your learning progress"
                        checked={preferences.progressUpdates}
                        onChange={() => handleToggle('progressUpdates')}
                        color="green"
                    />
                    <PreferenceItem
                        icon={Bell}
                        title="New Video Alerts"
                        description="Notifications when new videos are added to your playlists"
                        checked={preferences.newVideoAlerts}
                        onChange={() => handleToggle('newVideoAlerts')}
                        color="purple"
                    />
                    <PreferenceItem
                        icon={Star}
                        title="Completion Celebrations"
                        description="Celebrate when you complete courses or modules"
                        checked={preferences.completionCelebrations}
                        onChange={() => handleToggle('completionCelebrations')}
                        color="yellow"
                    />
                </div>
            </div>

            {/* Achievement Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Achievement Notifications
                </h2>
                <div className="space-y-4">
                    <PreferenceItem
                        icon={Star}
                        title="Badge Earned"
                        description="Get notified when you earn new badges"
                        checked={preferences.badgeEarned}
                        onChange={() => handleToggle('badgeEarned')}
                        color="yellow"
                    />
                    <PreferenceItem
                        icon={TrendingUp}
                        title="Milestone Reached"
                        description="Celebrate important learning milestones"
                        checked={preferences.milestoneReached}
                        onChange={() => handleToggle('milestoneReached')}
                        color="green"
                    />
                    <PreferenceItem
                        icon={Calendar}
                        title="Streak Reminders"
                        description="Reminders to maintain your learning streak"
                        checked={preferences.streakReminders}
                        onChange={() => handleToggle('streakReminders')}
                        color="orange"
                    />
                    <PreferenceItem
                        icon={TrendingUp}
                        title="Personal Bests"
                        description="Notifications about new personal records"
                        checked={preferences.personalBests}
                        onChange={() => handleToggle('personalBests')}
                        color="purple"
                    />
                </div>
            </div>

            {/* Social Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Volume2 className="w-5 h-5 mr-2 text-purple-500" />
                    Social Notifications
                </h2>
                <div className="space-y-4">
                    <PreferenceItem
                        icon={TrendingUp}
                        title="Friend Activity"
                        description="Notifications about friend requests and messages"
                        checked={preferences.friendActivity}
                        onChange={() => handleToggle('friendActivity')}
                        color="blue"
                    />
                    <PreferenceItem
                        icon={Bell}
                        title="New Followers"
                        description="Notifications when someone follows you"
                        checked={preferences.newFollowers}
                        onChange={() => handleToggle('newFollowers')}
                        color="green"
                    />
                    <PreferenceItem
                        icon={Mail}
                        title="Mentions"
                        description="When someone mentions you in comments"
                        checked={preferences.mentions}
                        onChange={() => handleToggle('mentions')}
                        color="orange"
                    />
                    <PreferenceItem
                        icon={Mail}
                        title="Comments"
                        description="Replies to your comments and discussions"
                        checked={preferences.comments}
                        onChange={() => handleToggle('comments')}
                        color="purple"
                    />
                </div>
            </div>

            {/* Marketing Communications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Marketing Communications
                </h2>
                <div className="space-y-4">
                    <PreferenceItem
                        icon={Bell}
                        title="Product Updates"
                        description="Information about new features and improvements"
                        checked={preferences.productUpdates}
                        onChange={() => handleToggle('productUpdates')}
                        color="blue"
                    />
                    <PreferenceItem
                        icon={Star}
                        title="New Features"
                        description="Early access and beta feature announcements"
                        checked={preferences.newFeatures}
                        onChange={() => handleToggle('newFeatures')}
                        color="purple"
                    />
                    <PreferenceItem
                        icon={TrendingUp}
                        title="Promotional Offers"
                        description="Special deals and discounts on courses"
                        checked={preferences.promotionalOffers}
                        onChange={() => handleToggle('promotionalOffers')}
                        color="green"
                    />
                    <PreferenceItem
                        icon={Mail}
                        title="Newsletter"
                        description="Monthly newsletter with tips and featured content"
                        checked={preferences.newsletter}
                        onChange={() => handleToggle('newsletter')}
                        color="orange"
                    />
                </div>
            </div>

            {/* Security Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-red-500" />
                    Security Notifications
                </h2>
                <div className="space-y-4">
                    <PreferenceItem
                        icon={Shield}
                        title="Login Alerts"
                        description="Notifications for new device logins"
                        checked={preferences.loginAlerts}
                        onChange={() => handleToggle('loginAlerts')}
                        color="red"
                        disabled={true}
                    />
                    <PreferenceItem
                        icon={Shield}
                        title="Password Changes"
                        description="Confirmations when your password is changed"
                        checked={preferences.passwordChanges}
                        onChange={() => handleToggle('passwordChanges')}
                        color="red"
                        disabled={true}
                    />
                    <PreferenceItem
                        icon={Shield}
                        title="Account Updates"
                        description="Important changes to your account settings"
                        checked={preferences.accountUpdates}
                        onChange={() => handleToggle('accountUpdates')}
                        color="red"
                        disabled={true}
                    />
                    <PreferenceItem
                        icon={Shield}
                        title="Suspicious Activity"
                        description="Alerts about unusual account activity"
                        checked={preferences.suspiciousActivity}
                        onChange={() => handleToggle('suspiciousActivity')}
                        color="red"
                        disabled={true}
                    />
                </div>
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-300 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Security notifications cannot be disabled for your account safety.
                    </p>
                </div>
            </div>

            {/* Email Frequency Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Email Frequency & Timing
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Summary Frequency
                        </label>
                        <select
                            value={preferences.summaryFrequency}
                            onChange={(e) => handleSelectChange('summaryFrequency', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="never">Never</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preferred Time
                        </label>
                        <select
                            value={preferences.reminderTime}
                            onChange={(e) => handleSelectChange('reminderTime', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="06:00">6:00 AM</option>
                            <option value="09:00">9:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="15:00">3:00 PM</option>
                            <option value="18:00">6:00 PM</option>
                            <option value="21:00">9:00 PM</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Time Zone
                        </label>
                        <select
                            value={preferences.timeZone}
                            onChange={(e) => handleSelectChange('timeZone', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="UTC-8">Pacific Time (UTC-8)</option>
                            <option value="UTC-7">Mountain Time (UTC-7)</option>
                            <option value="UTC-6">Central Time (UTC-6)</option>
                            <option value="UTC-5">Eastern Time (UTC-5)</option>
                            <option value="UTC+0">GMT (UTC+0)</option>
                            <option value="UTC+1">Central European Time (UTC+1)</option>
                            <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
                            <option value="UTC+9">Japan Standard Time (UTC+9)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
                </button>
            </div>
        </div>
    )
}

export default EmailPreferences 