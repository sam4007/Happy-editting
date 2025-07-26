import React, { useState, useEffect } from 'react'
import { Camera, User, Mail, Phone, MapPin, Globe, Save, Check, AlertCircle, Eye, EyeOff, Shield, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const ProfileSettings = () => {
    const { user, updateUserProfile, saveProfileData, getUserProfileData } = useAuth()
    const { addNotification } = useNotifications()

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        bio: '',
        phoneNumber: '',
        location: '',
        website: '',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowMessages: true
    })

    const [profileImage, setProfileImage] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [imagePreview, setImagePreview] = useState(null)

    // Load existing profile data when component mounts
    useEffect(() => {
        const loadProfileData = async () => {
            if (!user) return

            try {
                setIsLoadingData(true)
                const profileData = await getUserProfileData()

                if (profileData) {
                    setFormData({
                        displayName: profileData.displayName || user.displayName || '',
                        email: profileData.email || user.email || '',
                        bio: profileData.bio || '',
                        phoneNumber: profileData.phoneNumber || '',
                        location: profileData.location || '',
                        website: profileData.website || '',
                        profileVisibility: profileData.profileVisibility || 'public',
                        showEmail: profileData.showEmail || false,
                        showPhone: profileData.showPhone || false,
                        allowMessages: profileData.allowMessages !== undefined ? profileData.allowMessages : true
                    })
                    setProfileImage(profileData.photoURL || user.photoURL)
                } else {
                    // Fallback to user auth data
                    setFormData(prev => ({
                        ...prev,
                        displayName: user.displayName || '',
                        email: user.email || ''
                    }))
                    setProfileImage(user.photoURL)
                }
            } catch (error) {
                console.error('Error loading profile data:', error)
                setError('Failed to load profile data. Please refresh the page.')
            } finally {
                setIsLoadingData(false)
            }
        }

        loadProfileData()
    }, [user, getUserProfileData])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        // Clear messages when user starts typing
        if (success) setSuccess('')
        if (error) setError('')
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
                setImagePreview(reader.result)
                setProfileImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            // Update Firebase Auth user profile (display name and photo)
            await updateUserProfile({
                displayName: formData.displayName,
                photoURL: profileImage
            })

            // Save all profile data to Firestore
            await saveProfileData({
                displayName: formData.displayName,
                bio: formData.bio,
                phoneNumber: formData.phoneNumber,
                location: formData.location,
                website: formData.website,
                profileVisibility: formData.profileVisibility,
                showEmail: formData.showEmail,
                showPhone: formData.showPhone,
                allowMessages: formData.allowMessages,
                photoURL: profileImage
            })

            setSuccess('Profile updated successfully!')

            // Add notification
            addNotification({
                type: 'update',
                title: 'Profile Updated',
                message: 'Your profile information has been updated successfully.',
                icon: '✅'
            })

        } catch (error) {
            console.error('Profile update error:', error)
            setError(error.message || 'Failed to update profile. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading state while profile data is being loaded
    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64">
                <div className="p-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading profile data...</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64">
            <div className="p-6 space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Profile Settings
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage your personal information and privacy settings
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

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Profile Picture Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Profile Picture
                        </h2>

                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    {(imagePreview || user?.photoURL) ? (
                                        <img
                                            src={imagePreview || user?.photoURL}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <User className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Upload a new profile picture
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    JPG, PNG or GIF. Max size 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Display Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter your display name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Email cannot be changed here. Go to Account Settings to change your email.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter your location"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="https://your-website.com"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-blue-500" />
                            Privacy Settings
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Profile Visibility
                                </label>
                                <select
                                    name="profileVisibility"
                                    value={formData.profileVisibility}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="public">Public - Anyone can see your profile</option>
                                    <option value="private">Private - Only you can see your profile</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Show Email Address
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Allow others to see your email address
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="showEmail"
                                            checked={formData.showEmail}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Show Phone Number
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Allow others to see your phone number
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="showPhone"
                                            checked={formData.showPhone}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Lock className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Allow Messages
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Allow other users to send you messages
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="allowMessages"
                                            checked={formData.allowMessages}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ProfileSettings 