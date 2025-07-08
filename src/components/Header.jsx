import React, { useState } from 'react'
import { Search, Menu, Moon, Sun, Bell } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useVideo } from '../contexts/VideoContext'
import { useNotifications } from '../contexts/NotificationContext'
import UserProfileDropdown from './UserProfileDropdown'
import NotificationDropdown from './NotificationDropdown'

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    const { darkMode, toggleTheme } = useTheme()
    const { searchQuery, setSearchQuery } = useVideo()
    const { unreadCount } = useNotifications()
    const [notificationOpen, setNotificationOpen] = useState(false)

    const toggleNotifications = () => {
        setNotificationOpen(!notificationOpen)
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left section */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>

                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">HE</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                            Happy Editing
                        </h1>
                    </div>
                </div>

                {/* Center section - Search */}
                <div className="flex-1 max-w-2xl mx-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search lectures, instructors, or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                    </button>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={toggleNotifications}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                            title="Notifications"
                        >
                            <Bell className={`w-5 h-5 transition-colors ${
                                notificationOpen || unreadCount > 0 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-gray-700 dark:text-gray-300'
                            }`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        
                        {/* Notification Dropdown */}
                        <NotificationDropdown 
                            isOpen={notificationOpen} 
                            onClose={() => setNotificationOpen(false)} 
                        />
                    </div>

                    {/* User Profile Dropdown */}
                    <UserProfileDropdown />
                </div>
            </div>
        </header>
    )
}

export default Header 