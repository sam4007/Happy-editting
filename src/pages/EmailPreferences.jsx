import React, { useState } from 'react'
import { Bell, Mail, MessageSquare, Users, BookOpen, Calendar, Shield, Volume2, Clock, Save, Check, AlertCircle } from 'lucide-react'

const EmailPreferences = () => {
    const [preferences, setPreferences] = useState({
        // Learning notifications
        courseUpdates: true,
        assignmentReminders: true,
        progressReports: true,
        achievementBadges: true,
        studyReminders: true,

        // Social notifications
        friendRequests: true,
        messageNotifications: true,
        groupInvitations: true,
        studyGroupUpdates: false,

        // System notifications
        systemMaintenance: true,
        policyUpdates: true,
        serviceAnnouncements: true,

        // Marketing
        newsletters: false,
        promotions: false,
        surveys: false,

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
        // Clear any existing messages
        setSuccess('')
        setError('')
    }

    const handleSelectChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }))
        setSuccess('')
        setError('')
    }

    const handleSave = async () => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Here you would typically save to your backend/Firebase
            console.log('Saving preferences:', preferences)

            setSuccess('Email preferences saved successfully!')

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000)

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
            red: "text-red-500"
        }

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Email Preferences
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage your email notifications and communication preferences
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
                <div className="space-y-3">
                    <PreferenceItem
                        icon={BookOpen}
                        title="Course Updates"
                        description="New lessons, announcements, and course changes"
                        checked={preferences.courseUpdates}
                        onChange={() => handleToggle('courseUpdates')}
                        color="blue"
                    />
                    <PreferenceItem
                        icon={Calendar}
                        title="Assignment Reminders"
                        description="Upcoming deadlines and assignment notifications"
                        checked={preferences.assignmentReminders}
                        onChange={() => handleToggle('assignmentReminders')}
                        color="green"
                    />
                    <PreferenceItem
                        icon={BookOpen}
                        title="Progress Reports"
                        description="Weekly and monthly learning progress summaries"
                        checked={preferences.progressReports}
                        onChange={() => handleToggle('progressReports')}
                        color="purple"
                    />
                    <PreferenceItem
                        icon={BookOpen}
                        title="Achievement Badges"
                        description="Notifications when you earn new badges or certificates"
                        checked={preferences.achievementBadges}
                        onChange={() => handleToggle('achievementBadges')}
                        color="orange"
                    />
                    <PreferenceItem
                        icon={Bell}
                        title="Study Reminders"
                        description="Daily study reminders and motivation messages"
                        checked={preferences.studyReminders}
                        onChange={() => handleToggle('studyReminders')}
                        color="blue"
                    />
                </div>
            </div>

            {/* Social Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-500" />
                    Social Notifications
                </h2>
                <div className="space-y-3">
                    <PreferenceItem
                        icon={Users}
                        title="Friend Requests"
                        description="New friend requests and connections"
                        checked={preferences.friendRequests}
                        onChange={() => handleToggle('friendRequests')}
                        color="green"
                    />
                    <PreferenceItem
                        icon={MessageSquare}
                        title="Message Notifications"
                        description="Direct messages and chat notifications"
                        checked={preferences.messageNotifications}
                        onChange={() => handleToggle('messageNotifications')}
                        color="blue"
                    />
                    <PreferenceItem
                        icon={Users}
                        title="Group Invitations"
                        description="Study group invitations and requests"
                        checked={preferences.groupInvitations}
                        onChange={() => handleToggle('groupInvitations')}
                        color="purple"
                    />
                    <PreferenceItem
                        icon={Users}
                        title="Study Group Updates"
                        description="Updates from your study groups and collaborations"
                        checked={preferences.studyGroupUpdates}
                        onChange={() => handleToggle('studyGroupUpdates')}
                        color="green"
                    />
                </div>
            </div>

            {/* System Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-500" />
                    System Notifications
                </h2>
                <div className="space-y-3">
                    <PreferenceItem
                        icon={Volume2}
                        title="System Maintenance"
                        description="Scheduled maintenance and downtime notifications"
                        checked={preferences.systemMaintenance}
                        onChange={() => handleToggle('systemMaintenance')}
                        color="orange"
                    />
                    <PreferenceItem
                        icon={Shield}
                        title="Policy Updates"
                        description="Changes to terms of service and privacy policy"
                        checked={preferences.policyUpdates}
                        onChange={() => handleToggle('policyUpdates')}
                        color="blue"
                    />
                    <PreferenceItem
                        icon={Bell}
                        title="Service Announcements"
                        description="Important service updates and announcements"
                        checked={preferences.serviceAnnouncements}
                        onChange={() => handleToggle('serviceAnnouncements')}
                        color="purple"
                    />
                </div>
            </div>

            {/* Frequency Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-500" />
                    Frequency Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Summary Frequency
                        </label>
                        <select
                            value={preferences.summaryFrequency}
                            onChange={(e) => handleSelectChange('summaryFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="never">Never</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reminder Time
                        </label>
                        <select
                            value={preferences.reminderTime}
                            onChange={(e) => handleSelectChange('reminderTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="08:00">8:00 AM</option>
                            <option value="09:00">9:00 AM</option>
                            <option value="10:00">10:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="14:00">2:00 PM</option>
                            <option value="17:00">5:00 PM</option>
                            <option value="19:00">7:00 PM</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Time Zone
                        </label>
                        <select
                            value={preferences.timeZone}
                            onChange={(e) => handleSelectChange('timeZone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="UTC-8">Pacific Time (UTC-8)</option>
                            <option value="UTC-7">Mountain Time (UTC-7)</option>
                            <option value="UTC-6">Central Time (UTC-6)</option>
                            <option value="UTC-5">Eastern Time (UTC-5)</option>
                            <option value="UTC+0">UTC</option>
                            <option value="UTC+1">Central European Time (UTC+1)</option>
                            <option value="UTC+8">China Standard Time (UTC+8)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Save Changes
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your preferences will be applied immediately
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EmailPreferences 