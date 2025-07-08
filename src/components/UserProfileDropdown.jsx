import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Mail, Shield, ChevronDown, UserCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const UserProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
            setIsOpen(false)
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const handleNavigation = (path) => {
        navigate(path)
        setIsOpen(false)
    }

    const getUserInitials = () => {
        if (user?.displayName) {
            return user.displayName
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase()
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase()
        }
        return 'U'
    }

    const getUserDisplayName = () => {
        return user?.displayName || user?.email?.split('@')[0] || 'User'
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {/* User Avatar */}
                <div className="relative">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={getUserDisplayName()}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        />
                    ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {getUserInitials()}
                        </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>

                {/* User Name & Chevron */}
                <div className="hidden md:flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getUserDisplayName()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={getUserDisplayName()}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                                    {getUserInitials()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {getUserDisplayName()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email}
                                </p>
                                {user?.emailVerified && (
                                    <div className="flex items-center space-x-1 mt-1">
                                        <Shield className="w-3 h-3 text-green-500" />
                                        <span className="text-xs text-green-600 dark:text-green-400">Verified</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        {/* Profile Settings */}
                        <button
                            onClick={() => handleNavigation('/profile-settings')}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <User className="w-4 h-4" />
                            <span>Profile Settings</span>
                        </button>

                        {/* Account Settings */}
                        <button
                            onClick={() => handleNavigation('/account-settings')}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Account Settings</span>
                        </button>

                        {/* Email Preferences */}
                        <button
                            onClick={() => handleNavigation('/email-preferences')}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Email Preferences</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default UserProfileDropdown 