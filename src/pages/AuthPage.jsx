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
        <div className="min-h-screen relative overflow-hidden">
            {/* Premium Learning Industry Background */}
            <div className="absolute inset-0">
                {/* Rich Educational Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 via-teal-50 to-orange-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950"></div>

                {/* Layered Gradient Overlays */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-transparent to-purple-100/60 dark:from-blue-900/30 dark:to-purple-900/30"></div>
                    <div className="absolute inset-0 bg-gradient-to-bl from-teal-100/40 via-transparent to-orange-100/40 dark:from-teal-900/20 dark:to-orange-900/20"></div>
                </div>

                {/* Educational Illustrations */}
                <div className="absolute inset-0">
                    {/* Large Abstract Shapes */}
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-200/50 to-purple-300/50 dark:from-indigo-800/30 dark:to-purple-800/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-teal-200/50 to-blue-300/50 dark:from-teal-800/30 dark:to-blue-800/30 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/3 -right-20 w-64 h-64 bg-gradient-to-br from-orange-200/40 to-pink-300/40 dark:from-orange-800/25 dark:to-pink-800/25 rounded-full blur-2xl"></div>

                    {/* Educational Geometric Elements */}
                    <div className="absolute top-20 left-16 w-24 h-24 bg-gradient-to-br from-teal-300/40 to-blue-400/40 dark:from-teal-700/40 dark:to-blue-700/40 rounded-2xl rotate-12 blur-sm"></div>
                    <div className="absolute top-32 right-24 w-20 h-20 bg-gradient-to-br from-purple-300/40 to-pink-400/40 dark:from-purple-700/40 dark:to-pink-700/40 rounded-xl rotate-45 blur-sm"></div>
                    <div className="absolute bottom-40 left-32 w-16 h-16 bg-gradient-to-br from-orange-300/40 to-red-400/40 dark:from-orange-700/40 dark:to-red-700/40 rounded-lg rotate-12 blur-sm"></div>
                    <div className="absolute bottom-20 right-16 w-28 h-28 bg-gradient-to-br from-indigo-300/40 to-purple-400/40 dark:from-indigo-700/40 dark:to-purple-700/40 rounded-2xl rotate-45 blur-sm"></div>

                    {/* Floating Educational Icons */}
                    <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 dark:from-blue-600/40 dark:to-indigo-700/40 rounded-full animate-float"></div>
                    <div className="absolute top-3/4 right-1/3 w-6 h-6 bg-gradient-to-br from-teal-400/30 to-green-500/30 dark:from-teal-600/40 dark:to-green-700/40 rounded-full animate-float-delayed"></div>
                    <div className="absolute bottom-1/3 left-1/2 w-10 h-10 bg-gradient-to-br from-purple-400/30 to-pink-500/30 dark:from-purple-600/40 dark:to-pink-700/40 rounded-full animate-float-slow"></div>
                    <div className="absolute top-1/2 right-1/4 w-7 h-7 bg-gradient-to-br from-orange-400/30 to-red-500/30 dark:from-orange-600/40 dark:to-red-700/40 rounded-full animate-float"></div>

                    {/* Sophisticated Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.04]" style={{
                        backgroundImage: `
                            linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px),
                            linear-gradient(rgba(168, 85, 247, 0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168, 85, 247, 0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '48px 48px, 48px 48px, 96px 96px, 96px 96px'
                    }}></div>

                    {/* Premium Dot Matrix */}
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.06]" style={{
                        backgroundImage: `
                            radial-gradient(circle at 2px 2px, rgba(79, 70, 229, 0.3) 1px, transparent 0),
                            radial-gradient(circle at 34px 34px, rgba(168, 85, 247, 0.2) 1px, transparent 0)
                        `,
                        backgroundSize: '64px 64px, 64px 64px'
                    }}></div>

                    {/* Subtle Learning Industry Lines */}
                    <div className="absolute top-1/6 left-12 w-1 h-40 bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent dark:via-indigo-600/40 rotate-12"></div>
                    <div className="absolute top-2/3 right-16 w-1 h-32 bg-gradient-to-b from-transparent via-purple-400/30 to-transparent dark:via-purple-600/40 rotate-45"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-1 h-24 bg-gradient-to-b from-transparent via-teal-400/30 to-transparent dark:via-teal-600/40 rotate-12"></div>
                    <div className="absolute top-1/3 right-1/3 w-1 h-36 bg-gradient-to-b from-transparent via-orange-400/30 to-transparent dark:via-orange-600/40 rotate-45"></div>
                </div>

                {/* Abstract Learning Shapes */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Book-like Shape */}
                    <div className="absolute top-16 right-20 w-12 h-8 bg-gradient-to-r from-blue-300/20 to-indigo-400/20 dark:from-blue-700/30 dark:to-indigo-800/30 rounded-sm rotate-12 blur-sm"></div>
                    <div className="absolute top-18 right-19 w-12 h-8 bg-gradient-to-r from-indigo-300/25 to-purple-400/25 dark:from-indigo-700/35 dark:to-purple-800/35 rounded-sm rotate-12 blur-sm"></div>

                    {/* Lightbulb-like Shape */}
                    <div className="absolute bottom-32 left-20 w-6 h-10 bg-gradient-to-b from-yellow-300/25 to-orange-400/25 dark:from-yellow-600/30 dark:to-orange-700/30 rounded-full blur-sm"></div>
                    <div className="absolute bottom-28 left-21 w-8 h-2 bg-gradient-to-r from-gray-300/20 to-gray-400/20 dark:from-gray-600/25 dark:to-gray-700/25 rounded-sm blur-sm"></div>

                    {/* Graduation Cap Shape */}
                    <div className="absolute top-40 left-1/3 w-8 h-8 bg-gradient-to-br from-purple-300/20 to-pink-400/20 dark:from-purple-700/25 dark:to-pink-800/25 rounded-sm rotate-45 blur-sm"></div>
                    <div className="absolute top-36 left-1/3 w-4 h-12 bg-gradient-to-b from-purple-300/15 to-purple-400/15 dark:from-purple-700/20 dark:to-purple-800/20 rounded-sm rotate-12 blur-sm"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Auth Forms */}
                    <div className="premium-card p-8 mb-6 animate-slide-up">
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
                        <p className="text-sm text-slate-600 dark:text-slate-400">
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

                        {/* Trust Indicators */}
                        <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-slate-500 dark:text-slate-500">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>Secure & Encrypted</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse animation-delay-1000"></div>
                                <span>GDPR Compliant</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthPage 