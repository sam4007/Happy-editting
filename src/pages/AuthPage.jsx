import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/LoginForm'
import SignupForm from '../components/SignupForm'
import ForgotPasswordForm from '../components/ForgotPasswordForm'

const AuthPage = () => {
    const [currentView, setCurrentView] = useState('login') // 'login', 'signup', 'forgot-password'
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    // Redirect authenticated users to main app
    useEffect(() => {
        if (!loading && user) {
            navigate('/', { replace: true })
        }
    }, [user, loading, navigate])

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
                </div>
            </div>
        )
    }

    const handleSwitchToSignup = () => {
        setCurrentView('signup')
    }

    const handleSwitchToLogin = () => {
        setCurrentView('login')
    }

    const handleForgotPassword = () => {
        setCurrentView('forgot-password')
    }

    const handleBackToLogin = () => {
        setCurrentView('login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                }}></div>
            </div>

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                        <span className="text-2xl font-bold text-white">L</span>
                    </div>
                    <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                        Welcome to Lumière
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {currentView === 'login' && 'Sign in to your account'}
                        {currentView === 'signup' && 'Create your learning journey'}
                        {currentView === 'forgot-password' && 'Reset your password'}
                    </p>
                </div>

                {/* Auth Forms */}
                <div className="glass-card p-8 mb-6">
                    {currentView === 'login' && (
                        <LoginForm
                            onSwitchToSignup={handleSwitchToSignup}
                            onForgotPassword={handleForgotPassword}
                        />
                    )}
                    {currentView === 'signup' && (
                        <SignupForm
                            onSwitchToLogin={handleSwitchToLogin}
                        />
                    )}
                    {currentView === 'forgot-password' && (
                        <ForgotPasswordForm
                            onBackToLogin={handleBackToLogin}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentView === 'login' && (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={handleSwitchToSignup}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                                >
                                    Sign up
                                </button>
                            </>
                        )}
                        {currentView === 'signup' && (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={handleSwitchToLogin}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                                >
                                    Sign in
                                </button>
                            </>
                        )}
                        {currentView === 'forgot-password' && (
                            <>
                                Remember your password?{' '}
                                <button
                                    onClick={handleBackToLogin}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                                >
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AuthPage 