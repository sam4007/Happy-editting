import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Chrome, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const LoginForm = ({ onSwitchToSignup, onForgotPassword }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')
    const [success, setSuccess] = useState('')

    const { login, signInWithGoogle, error, clearError } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
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

        try {
            await login(formData.email, formData.password)
            setSuccess('Login successful! Welcome back!')
            // Redirect to main app after successful login
            setTimeout(() => {
                navigate('/', { replace: true })
            }, 1000)
        } catch (error) {
            console.error('Login error:', error)
            setLocalError(error.message || 'Failed to login. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        setLocalError('')
        setSuccess('')

        try {
            await signInWithGoogle()
            setSuccess('Login successful! Welcome!')
            setTimeout(() => {
                navigate('/', { replace: true })
            }, 1000)
        } catch (error) {
            console.error('Google sign-in error:', error)
            setLocalError(error.message || 'Failed to sign in with Google. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Error/Success Messages */}
            {(localError || error) && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-700 dark:text-red-400">
                            {localError || error}
                        </p>
                    </div>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-green-700 dark:text-green-400">
                            {success}
                        </p>
                    </div>
                </div>
            )}

            {/* Google Sign In Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center space-x-3"
            >
                <Chrome className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">
                        Or continue with email
                    </span>
                </div>
            </div>

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="input-premium pl-12"
                            placeholder="Enter your email"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="input-premium pl-12 pr-12"
                            placeholder="Enter your password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none transition-colors"
                    >
                        Forgot your password?
                    </button>
                </div>

                {/* Sign In Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full"
                >
                    <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </button>
            </form>
        </div>
    )
}

export default LoginForm 