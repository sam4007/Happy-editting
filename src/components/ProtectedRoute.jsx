import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    const [loadingTimeout, setLoadingTimeout] = useState(false)

    // Fallback timeout in case loading gets stuck
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ Loading timeout reached, forcing completion')
                setLoadingTimeout(true)
            }
        }, 10000) // 10 second timeout

        return () => clearTimeout(timeout)
    }, [loading])

    // Show loading spinner while checking authentication (with timeout fallback)
    if (loading && !loadingTimeout) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full animate-pulse">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-lg text-gray-600 dark:text-gray-400">Loading Lumière...</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Please wait while we set up your learning environment
                    </p>
                </div>
            </div>
        )
    }

    // If user is not authenticated, redirect to auth page
    if (!user) {
        return <Navigate to="/auth" replace />
    }

    // If user is authenticated, render the protected content
    return children
}

export default ProtectedRoute 