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
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed left-0 w-72 z-30 transform transition-all duration-300 ease-out
                    ${open ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 lg:w-64
                `}
                style={{
                    top: '57px',
                    height: 'calc(100vh - 57px)'
                }}
            >
                <div className={`
                    h-full border-r border-white/20 dark:border-white/10 rounded-none flex flex-col
                    ${open ? 'glass-card' : ''}
                    lg:bg-white dark:lg:bg-black
                `} style={{ borderRadius: '0' }}>
                    {/* Close button for mobile */}
                    <div className="lg:hidden flex justify-end p-4 flex-shrink-0">
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Navigation - Scrollable Content */}
                    <nav className="flex-1 px-6 py-4 overflow-y-auto">
                        <div className="space-y-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.to)

                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={(e) => {
                                            console.log('🧭 Sidebar: Navigating to:', item.to, 'from:', location.pathname)
                                            setOpen(false)
                                        }}
                                        className={`nav-item group ${active ? 'active' : ''}`}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 transition-colors ${active
                                            ? 'text-white'
                                            : open
                                                ? 'text-black dark:text-gray-400'
                                                : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                                            }`} />
                                        <span className={`font-medium ${open ? 'text-black dark:text-gray-400' : ''}`}>{item.label}</span>
                                    </NavLink>
                                )
                            })}
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-8">
                            <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider mb-3 ${open ? 'text-black dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="nav-item w-full text-left group hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                >
                                    <Plus className={`w-5 h-5 mr-3 transition-colors ${open
                                        ? 'text-black dark:text-gray-400'
                                        : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                                    <span className={`font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${open ? 'text-black dark:text-gray-400' : ''}`}>Add Video</span>
                                </button>

                                <button
                                    onClick={handleFavoritesClick}
                                    className="nav-item w-full text-left group"
                                >
                                    <Star className={`w-5 h-5 mr-3 transition-colors ${open
                                        ? 'text-black dark:text-gray-400'
                                        : 'text-gray-500 dark:text-gray-400 group-hover:text-yellow-500'}`} />
                                    <span className={`font-medium ${open ? 'text-black dark:text-gray-400' : ''}`}>Favorites</span>
                                </button>

                                <button
                                    onClick={handleWatchLaterClick}
                                    className="nav-item w-full text-left group"
                                >
                                    <Clock className={`w-5 h-5 mr-3 transition-colors ${open
                                        ? 'text-black dark:text-gray-400'
                                        : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500'}`} />
                                    <span className={`font-medium ${open ? 'text-black dark:text-gray-400' : ''}`}>Watch Later</span>
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="mt-8">
                                <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider mb-3 ${open ? 'text-black dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    Categories
                                </h3>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(null)
                                            navigate('/library')
                                            setOpen(false)
                                        }}
                                        className={`nav-item w-full text-left ${selectedCategory === null ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                                    >
                                        <span className="w-3 h-3 rounded-full bg-gray-400 mr-3"></span>
                                        <span className={`font-medium ${open ? 'text-black dark:text-gray-400' : ''}`}>All Videos</span>
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => {
                                                setSelectedCategory(category)
                                                navigate('/library')
                                                setOpen(false)
                                            }}
                                            className={`nav-item w-full text-left ${selectedCategory === category ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                                        >
                                            <span className="w-3 h-3 rounded-full bg-indigo-400 mr-3"></span>
                                            <span className={`font-medium capitalize ${open ? 'text-black dark:text-gray-400' : ''}`}>{category}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* User Profile - Bottom - Fixed */}
                    <div className="flex-shrink-0 p-6 border-t border-white/20 dark:border-white/10">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold text-sm">
                                    {getInitials(user?.displayName || user?.email)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${open ? 'text-black dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {user?.displayName || 'User'}
                                </p>
                                <p className={`text-xs truncate ${open ? 'text-black dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
