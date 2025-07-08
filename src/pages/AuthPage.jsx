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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
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

    switch (currentView) {
        case 'signup':
            return <SignupForm onSwitchToLogin={handleSwitchToLogin} />
        case 'forgot-password':
            return <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
        case 'login':
        default:
            return (
                <LoginForm
                    onSwitchToSignup={handleSwitchToSignup}
                    onForgotPassword={handleForgotPassword}
                />
            )
    }
}

export default AuthPage 