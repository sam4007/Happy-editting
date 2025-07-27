import React, { useState } from 'react'
import { Menu, Moon, Sun, Bell } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../contexts/NotificationContext'
import UserProfileDropdown from './UserProfileDropdown'
import NotificationDropdown from './NotificationDropdown'

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    const { darkMode, toggleTheme } = useTheme()
    const { unreadCount } = useNotifications()
    const [notificationOpen, setNotificationOpen] = useState(false)

    const toggleNotifications = () => {
        setNotificationOpen(!notificationOpen)
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/60 backdrop-blur-2xl border-b border-white/20 dark:border-white/10">
            <div className="max-w-none px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Left section */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150"
                        >
                            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>

                        <div className="flex items-center">
                            <h1 className="text-xl font-normal text-gray-900 dark:text-white">
                                Lumière
                            </h1>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center space-x-1">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150"
                            title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                        >
                            {darkMode ? (
                                <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={toggleNotifications}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150 relative"
                                title="Notifications"
                            >
                                <Bell className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center text-[10px]">
                                        {unreadCount > 9 ? '9+' : unreadCount}
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
            </div>
        </header>
    )
}

export default Header 