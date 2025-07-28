import React, { useState } from 'react'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
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
        setIsLoading(true)
        setLocalError('')
        setSuccess('')

        if (!email.trim()) {
            setLocalError('Email is required')
            setIsLoading(false)
            return
        }

        try {
            await resetPassword(email)
            setSuccess('Password reset email sent! Check your inbox for instructions.')
        } catch (error) {
            console.error('Password reset error:', error)
            setLocalError(error.message || 'Failed to send password reset email. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Back to Login */}
            <button
                type="button"
                onClick={onBackToLogin}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to sign in</span>
            </button>

            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                    Reset your password
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            {/* Error/Success Messages */}
            {(localError || error) && (
                <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                            {localError || error}
                        </p>
                    </div>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-2xl bg-green-50/80 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30 backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                            {success}
                        </p>
                    </div>
                </div>
            )}

            {/* Reset Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="flex items-center input-premium py-4 group">
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                <Mail className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={handleChange}
                                className="flex-1 bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || success}
                    className="btn-primary w-full py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
                    {isLoading && (
                        <div className="w-4 h-4 ml-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                </button>
            </form>

            {success && (
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Didn't receive the email?{' '}
                        <button
                            onClick={() => {
                                setSuccess('')
                                setLocalError('')
                            }}
                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors hover:underline"
                        >
                            Try again
                        </button>
                    </p>
                </div>
            )}
        </div>
    )
}

export default ForgotPasswordForm 