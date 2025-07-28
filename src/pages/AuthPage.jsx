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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Enhanced Background */}
            <div className="absolute inset-0 -z-10">
                {/* Dynamic Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950"></div>

                {/* Animated Gradient Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-1000"></div>
                <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400/30 to-blue-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.3) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}></div>

                {/* Floating Particles */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400/20 rounded-full animate-float"></div>
                    <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-purple-400/20 rounded-full animate-float-delayed"></div>
                    <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-indigo-400/20 rounded-full animate-float-slow"></div>
                </div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Auth Forms */}
                <div className="glass-card-frosted p-8 mb-6 animate-slide-up">
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
                <div className="text-center animate-fade-in">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentView === 'login' && (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={handleSwitchToSignup}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors hover:underline"
                                >
                                    Sign up here
                                </button>
                            </>
                        )}
                        {currentView === 'signup' && (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={handleSwitchToLogin}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors hover:underline"
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
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors hover:underline"
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