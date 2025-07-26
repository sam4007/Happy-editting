import React, { useState } from 'react'
import { Shield, Lock, Mail, Eye, EyeOff, Key, AlertTriangle, Check, AlertCircle, Trash2, User, Save, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const AccountSettings = () => {
    const { user, resetPassword, logout, updateUserPassword, sendVerificationEmail, deleteAccount } = useAuth()
    const { addNotification } = useNotifications()

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deletePassword, setDeletePassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordData(prev => ({ ...prev, [name]: value }))
        if (success) setSuccess('')
        if (error) setError('')
    }

    const handlePasswordUpdate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match')
            setIsLoading(false)
            return
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long')
            setIsLoading(false)
            return
        }

        try {
            await updateUserPassword(passwordData.currentPassword, passwordData.newPassword)

            setSuccess('Password updated successfully!')
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })

            addNotification({
                type: 'security',
                title: 'Password Updated',
                message: 'Your password has been changed successfully.',
                icon: '🔐'
            })

        } catch (error) {
            setError(error.message || 'Failed to update password. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEmailVerification = async () => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            await sendVerificationEmail()
            setSuccess('Verification email sent! Please check your inbox.')

            addNotification({
                type: 'update',
                title: 'Verification Email Sent',
                message: 'Please check your email to verify your account.',
                icon: '📧'
            })

        } catch (error) {
            setError(error.message || 'Failed to send verification email. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordReset = async () => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            await resetPassword(user.email)
            setSuccess('Password reset email sent! Please check your inbox.')

            addNotification({
                type: 'security',
                title: 'Password Reset',
                message: 'Password reset email has been sent to your email address.',
                icon: '🔑'
            })

        } catch (error) {
            setError('Failed to send password reset email. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            setError('Please type "DELETE" to confirm account deletion')
            return
        }

        if (!deletePassword) {
            setError('Please enter your password to confirm account deletion')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            await deleteAccount(deletePassword)

            addNotification({
                type: 'security',
                title: 'Account Deleted',
                message: 'Your account has been successfully deleted.',
                icon: '🗑️'
            })

            // Logout user after account deletion
            setTimeout(() => {
                logout()
            }, 1000)

        } catch (error) {
            setError(error.message || 'Failed to delete account. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-64">
            <div className="p-6 space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Account Settings
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage your account security and preferences
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

                {/* Account Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-500" />
                        Account Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                {user?.email || 'Not available'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                {user?.displayName || 'Not set'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Created</label>
                            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                {user?.metadata?.creationTime ? formatDate(user.metadata.creationTime) : 'Not available'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Sign In</label>
                            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                {user?.metadata?.lastSignInTime ? formatDate(user.metadata.lastSignInTime) : 'Not available'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg font-mono">
                                {user?.uid || 'Not available'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Verified</label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${user?.emailVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className={user?.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                        {user?.emailVerified ? 'Verified' : 'Not Verified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Verification Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-blue-500" />
                        Email Verification
                    </h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${user?.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {user?.email}
                            </span>
                        </div>

                        {!user?.emailVerified && (
                            <button
                                onClick={handleEmailVerification}
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                <span>{isLoading ? 'Sending...' : 'Send Verification'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Password Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-red-500" />
                        Password Settings
                    </h2>

                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Key className="w-4 h-4" />
                                <span>Reset via Email</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Delete Account */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Delete Account
                    </h2>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Warning:</strong> This action cannot be undone. Deleting your account will permanently remove all your data, including videos, progress, and settings.
                        </p>
                    </div>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Account</span>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Please type <strong>DELETE</strong> to confirm account deletion:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE to confirm"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Enter your password to confirm:
                                </p>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isLoading || deleteConfirmText !== 'DELETE' || !deletePassword}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{isLoading ? 'Deleting...' : 'Confirm Delete'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false)
                                        setDeleteConfirmText('')
                                        setDeletePassword('')
                                    }}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AccountSettings 