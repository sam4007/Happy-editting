import React, { useState } from 'react'
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ForgotPasswordForm = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')
    const [success, setSuccess] = useState('')

    const { resetPassword, error, clearError } = useAuth()

    const handleChange = (e) => {
        setEmail(e.target.value)
        // Clear errors when user starts typing
        if (localError) setLocalError('')
        if (error) clearError()
        if (success) setSuccess('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email.trim()) {
            setLocalError('Email address is required')
            return
        }

        setIsLoading(true)
        setLocalError('')
        setSuccess('')

        try {
            await resetPassword(email)
            setSuccess('Password reset email sent! Please check your inbox and follow the instructions.')
        } catch (error) {
            console.error('Password reset error:', error)
            setLocalError(error.message || 'Failed to send password reset email. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const displayError = localError || error

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-full">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Enter your email address and we'll send you a link to reset your password
                    </p>
                </div>

                {/* Error/Success Messages */}
                {displayError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300">{displayError}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                    </div>
                )}

                {/* Reset Password Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                placeholder="Enter your email address"
                            />
                        </div>
                    </div>

                    {/* Send Reset Email Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <span className="font-medium">
                            {isLoading ? 'Sending...' : 'Send Reset Email'}
                        </span>
                        {!isLoading && <Send className="w-4 h-4" />}
                    </button>

                    {/* Back to Login */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={onBackToLogin}
                            className="flex items-center justify-center space-x-2 w-full py-2 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 focus:outline-none"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Sign In</span>
                        </button>
                    </div>
                </form>

                {/* Additional Help */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Need help?
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        If you don't receive the email within a few minutes, please check your spam folder.
                        Still having trouble? Contact our support team for assistance.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordForm 