import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    Home,
    Library,
    BarChart3,
    Settings,
    Star,
    Clock,
    Plus,
    X,
    Users
} from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'
import { useAuth } from '../contexts/AuthContext'
import AddVideoModal from './AddVideoModal'

const Sidebar = ({ open, setOpen }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { categories, selectedCategory, setSelectedCategory } = useVideo()
    const { user } = useAuth()
    const [showAddModal, setShowAddModal] = useState(false)

    const navigationItems = [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/library', icon: Library, label: 'Library' },
        { to: '/friends', icon: Users, label: 'Friends' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ]

    const isActive = (path) => {
        return location.pathname === path
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }

    const handleFavoritesClick = () => {
        navigate('/library?filter=favorites')
        setOpen(false)
    }

    const handleWatchLaterClick = () => {
        navigate('/library?filter=watch-history')
        setOpen(false)
    }

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Close button for mobile */}
                    <div className="flex items-center justify-between p-4 lg:hidden">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto modern-scrollbar px-4 pb-4">
                        {/* Navigation */}
                        <nav className="space-y-2">
                            {navigationItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setOpen(false)}
                                    className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive(item.to)
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {/* Quick Actions */}
                        <div className="mt-8">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Video</span>
                                </button>
                                <button
                                    onClick={handleFavoritesClick}
                                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Star className="w-5 h-5" />
                                    <span>Favorites</span>
                                </button>
                                <button
                                    onClick={handleWatchLaterClick}
                                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Clock className="w-5 h-5" />
                                    <span>Watch Later</span>
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="mt-8">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Categories
                            </h3>
                            <div className="space-y-1">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`
                      flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors
                      ${selectedCategory === category
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }
                    `}
                                    >
                                        <span>{category}</span>
                                        {selectedCategory === category && (
                                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    {getInitials(user?.displayName)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.displayName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    Premium Member
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Video Modal */}
            <AddVideoModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </>
    )
}

export default Sidebar
