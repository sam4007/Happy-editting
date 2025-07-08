import React, { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, Settings, Clock } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'

const NotificationDropdown = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications()
    const [filter, setFilter] = useState('all') // all, unread, read
    const dropdownRef = useRef(null)

    // Filter notifications based on current filter
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.read
        if (filter === 'read') return notification.read
        return true
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    const formatTime = (timeString) => {
        const date = new Date(timeString)
        const now = new Date()
        const diff = now - date

        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

        return date.toLocaleDateString()
    }

    const getNotificationIcon = (type, icon) => {
        if (icon) return icon

        switch (type) {
            case 'achievement': return '🎉'
            case 'reminder': return '📚'
            case 'security': return '🔐'
            case 'update': return '🚀'
            default: return '📢'
        }
    }

    const getNotificationColor = (type) => {
        switch (type) {
            case 'achievement': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            case 'reminder': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            case 'update': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
        }
    }

    if (!isOpen) return null

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notifications
                    </h3>
                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {[
                        { key: 'all', label: `All (${notifications.length})` },
                        { key: 'unread', label: `Unread (${unreadCount})` },
                        { key: 'read', label: `Read (${notifications.length - unreadCount})` }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors ${filter === tab.key
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'unread' ? 'No unread notifications' :
                                filter === 'read' ? 'No read notifications' :
                                    'No notifications yet'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    {/* Notification icon */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                                            {getNotificationIcon(notification.type, notification.icon)}
                                        </div>
                                    </div>

                                    {/* Notification content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {notification.title}
                                            </h4>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatTime(notification.time)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={clearAllNotifications}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                            Clear all
                        </button>
                        <button
                            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationDropdown 