import React, { useState, useEffect } from 'react'
import {
    User,
    Bell,
    Shield,
    Download,
    Database,
    Moon,
    Sun,
    Volume2,
    Play,
    Trash2,
    Save,
    Eye,
    EyeOff,
    Camera,
    Check,
    AlertCircle
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useVideo } from '../contexts/VideoContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const Settings = () => {
    const { darkMode, toggleTheme } = useTheme()
    const { videos, favorites, watchHistory } = useVideo()
    const { user, updateUserProfile, saveProfileData, getUserProfileData } = useAuth()
    const { addNotification } = useNotifications()
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(false)
    const [dataLoading, setDataLoading] = useState(true)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Profile form data
    const [profileData, setProfileData] = useState({
        displayName: '',
        email: '',
        photoURL: '',
        bio: '',
        phoneNumber: '',
        location: '',
        website: ''
    })

    // Initialize profile data from user and load from Firestore
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setDataLoading(true)
                if (user) {
                    // Load additional profile data from Firestore
                    const firestoreData = await getUserProfileData()

                    setProfileData({
                        displayName: user.displayName || '',
                        email: user.email || '',
                        photoURL: user.photoURL || '',
                        bio: firestoreData?.bio || '',
                        phoneNumber: firestoreData?.phoneNumber || '',
                        location: firestoreData?.location || '',
                        website: firestoreData?.website || ''
                    })
                }
            } catch (error) {
                console.error('Error loading profile data:', error)
                // Fallback to basic user data if Firestore fails
                if (user) {
                    setProfileData({
                        displayName: user.displayName || '',
                        email: user.email || '',
                        photoURL: user.photoURL || '',
                        bio: '',
                        phoneNumber: '',
                        location: '',
                        website: ''
                    })
                }
            } finally {
                setDataLoading(false)
            }
        }

        loadProfileData()
    }, [user, getUserProfileData])

    const [settings, setSettings] = useState({
        notifications: {
            newVideos: true,
            completions: true,
            reminders: false,
            email: true
        },
        playback: {
            autoplay: true,
            speed: 1.0,
            quality: 'auto',
            captions: false
        },
        privacy: {
            saveHistory: true,
            analytics: true,
            shareProgress: false
        }
    })

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'playback', label: 'Playback', icon: Play },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'storage', label: 'Storage', icon: Database },
    ]

    const handleSettingChange = (category, setting, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [setting]: value
            }
        }))
    }

    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear messages when user starts typing
        if (success) setSuccess('')
        if (error) setError('')
    }

    const handleProfileUpdate = async () => {
        try {
            setLoading(true)
            setError('')
            setSuccess('')

            // Update Firebase Auth profile
            await updateUserProfile({
                displayName: profileData.displayName,
                photoURL: profileData.photoURL
            })

            // Save additional profile data to Firestore
            await saveProfileData({
                displayName: profileData.displayName,
                photoURL: profileData.photoURL,
                bio: profileData.bio,
                phoneNumber: profileData.phoneNumber,
                location: profileData.location,
                website: profileData.website
            })

            setSuccess('Profile updated successfully!')
            if (addNotification) {
                addNotification('Profile updated successfully!', 'success')
            }
        } catch (error) {
            setError(error.message || 'Failed to update profile')
            if (addNotification) {
                addNotification('Failed to update profile', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image file size must be less than 5MB')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setProfileData(prev => ({
                    ...prev,
                    photoURL: reader.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const clearAllData = () => {
        if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear()
            window.location.reload()
        }
    }

    const exportData = () => {
        const data = {
            videos,
            favorites,
            watchHistory,
            settings,
            userProfile: {
                displayName: user?.displayName,
                email: user?.email,
                emailVerified: user?.emailVerified
            },
            exportDate: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'video-lecture-data.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="min-h-screen animate-fade-in">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Settings
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage your account and app preferences
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Shield className="w-8 h-8 text-indigo-500" />
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="glass-card p-6 border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/20">
                        <div className="flex items-center space-x-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">{success}</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="glass-card p-6 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/20">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-6">
                            <div className="space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === tab.id
                                                ? 'bg-indigo-500 text-white shadow-lg'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="glass-card p-8">
                            {activeTab === 'profile' && (
                                <div className="space-y-8">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            Profile Information
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Update your personal information and profile settings
                                        </p>
                                    </div>

                                    {dataLoading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center space-x-6 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                <div className="relative">
                                                    {profileData.photoURL ? (
                                                        <img
                                                            src={profileData.photoURL}
                                                            alt="Profile"
                                                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                                                            <span className="text-white font-bold text-2xl">
                                                                {getInitials(profileData.displayName)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <label className="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-indigo-600 transition-colors">
                                                        <Camera className="w-4 h-4" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                        Profile Picture
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                        Click the camera icon to upload a new picture
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                        Max file size: 5MB • PNG, JPG, GIF supported
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="displayName"
                                                        value={profileData.displayName}
                                                        onChange={handleProfileChange}
                                                        className="input-premium"
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={profileData.email}
                                                        disabled
                                                        className="input-premium opacity-50 cursor-not-allowed"
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Email cannot be changed here. Contact support if needed.
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Phone Number
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phoneNumber"
                                                        value={profileData.phoneNumber}
                                                        onChange={handleProfileChange}
                                                        className="input-premium"
                                                        placeholder="Enter your phone number"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Location
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="location"
                                                        value={profileData.location}
                                                        onChange={handleProfileChange}
                                                        className="input-premium"
                                                        placeholder="City, Country"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Website
                                                    </label>
                                                    <input
                                                        type="url"
                                                        name="website"
                                                        value={profileData.website}
                                                        onChange={handleProfileChange}
                                                        className="input-premium"
                                                        placeholder="https://your-website.com"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Bio
                                                    </label>
                                                    <textarea
                                                        name="bio"
                                                        value={profileData.bio}
                                                        onChange={handleProfileChange}
                                                        rows={4}
                                                        className="input-premium resize-none"
                                                        placeholder="Tell us about yourself..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Reset form
                                                        setProfileData({
                                                            displayName: user?.displayName || '',
                                                            email: user?.email || '',
                                                            photoURL: user?.photoURL || '',
                                                            bio: '',
                                                            phoneNumber: '',
                                                            location: '',
                                                            website: ''
                                                        })
                                                    }}
                                                    className="btn-secondary"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={handleProfileUpdate}
                                                    disabled={loading}
                                                    className="btn-primary"
                                                >
                                                    {loading ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            <span>Saving...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2">
                                                            <Save className="w-4 h-4" />
                                                            <span>Save Changes</span>
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Notification Preferences
                                        </h3>

                                        <div className="space-y-4">
                                            {[
                                                { key: 'newVideos', label: 'New Videos', desc: 'Get notified when new videos are added' },
                                                { key: 'completions', label: 'Completions', desc: 'Celebrate when you complete a video' },
                                                { key: 'reminders', label: 'Study Reminders', desc: 'Daily reminders to continue learning' },
                                                { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' }
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.label}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSettingChange('notifications', item.key, !settings.notifications[item.key])}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notifications[item.key] ? 'bg-primary-600' : 'bg-gray-200'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'playback' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Playback Settings
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        Autoplay
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Automatically play the next video
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleSettingChange('playback', 'autoplay', !settings.playback.autoplay)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.playback.autoplay ? 'bg-primary-600' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.playback.autoplay ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Default Playback Speed
                                                </label>
                                                <select
                                                    value={settings.playback.speed}
                                                    onChange={(e) => handleSettingChange('playback', 'speed', parseFloat(e.target.value))}
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                >
                                                    <option value={0.5}>0.5x</option>
                                                    <option value={0.75}>0.75x</option>
                                                    <option value={1.0}>1.0x (Normal)</option>
                                                    <option value={1.25}>1.25x</option>
                                                    <option value={1.5}>1.5x</option>
                                                    <option value={2.0}>2.0x</option>
                                                </select>
                                            </div>

                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Default Quality
                                                </label>
                                                <select
                                                    value={settings.playback.quality}
                                                    onChange={(e) => handleSettingChange('playback', 'quality', e.target.value)}
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                >
                                                    <option value="auto">Auto</option>
                                                    <option value="1080p">1080p</option>
                                                    <option value="720p">720p</option>
                                                    <option value="480p">480p</option>
                                                    <option value="360p">360p</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Privacy Settings
                                        </h3>

                                        <div className="space-y-4">
                                            {[
                                                { key: 'saveHistory', label: 'Save Watch History', desc: 'Keep track of videos you\'ve watched' },
                                                { key: 'analytics', label: 'Analytics', desc: 'Allow collection of learning analytics' },
                                                { key: 'shareProgress', label: 'Share Progress', desc: 'Share your learning progress with others' }
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.label}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSettingChange('privacy', item.key, !settings.privacy[item.key])}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.privacy[item.key] ? 'bg-primary-600' : 'bg-gray-200'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'storage' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Storage & Data
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                    Storage Usage
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Videos</span>
                                                        <span className="text-gray-900 dark:text-white">{videos.length} items</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Favorites</span>
                                                        <span className="text-gray-900 dark:text-white">{favorites.length} items</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Watch History</span>
                                                        <span className="text-gray-900 dark:text-white">{watchHistory.length} items</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={exportData}
                                                    className="w-full flex items-center justify-center space-x-2 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    <span>Export Data</span>
                                                </button>

                                                <button
                                                    onClick={clearAllData}
                                                    className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                    <span>Clear All Data</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleProfileUpdate}
                                    disabled={loading}
                                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings 