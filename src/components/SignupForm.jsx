import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Chrome, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const SignupForm = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')
    const [success, setSuccess] = useState('')

    const { signup, signInWithGoogle, error, clearError } = useAuth()
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

    const validateForm = () => {
        if (!formData.name.trim()) {
            setLocalError('Name is required')
            return false
        }
        if (!formData.email.trim()) {
            setLocalError('Email is required')
            return false
        }
        if (formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters long')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match')
            return false
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setLocalError('')
        setSuccess('')

        if (!validateForm()) {
            setIsLoading(false)
            return
        }

        try {
            await signup(formData.email, formData.password, formData.name)
            setSuccess('Account created successfully! Welcome aboard!')
            // Redirect to main app after successful signup
            setTimeout(() => {
                navigate('/', { replace: true })
            }, 1000)
        } catch (error) {
            console.error('Signup error:', error)
            setLocalError(error.message || 'Failed to create account. Please try again.')
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
            setSuccess('Account created successfully! Welcome!')
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

            {/* Google Sign In Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center space-x-3 py-4"
            >
                <Chrome className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600 opacity-50" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 py-1 bg-white/90 dark:bg-slate-900/90 text-gray-500 dark:text-gray-400 rounded-full backdrop-blur-sm border border-white/50 dark:border-gray-700/50">
                        Or create account with email
                    </span>
                </div>
            </div>

            {/* Signup Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Name Input */}
                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                    </label>
                    <div className="relative">
                        <div className="flex items-center input-premium py-4 group">
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                <User className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="flex-1 bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>
                </div>

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
                                value={formData.email}
                                onChange={handleChange}
                                className="flex-1 bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                    </label>
                    <div className="relative">
                        <div className="flex items-center input-premium py-4 group">
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                <Lock className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="flex-1 bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                                placeholder="Enter your password"
                            />
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 focus:outline-none transition-colors duration-200 p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <div className="flex items-center input-premium py-4 group">
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                <Lock className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="flex-1 bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                                placeholder="Confirm your password"
                            />
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 focus:outline-none transition-colors duration-200 p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sign Up Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                    {isLoading && (
                        <div className="w-4 h-4 ml-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                </button>
            </form>
        </div>
    )
}

export default SignupForm 