import React, { createContext, useContext, useState, useEffect } from 'react'

const NotificationContext = createContext()

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'achievement',
            title: 'Welcome to Lumière!',
            message: 'You\'ve successfully set up your account. Start your learning journey!',
            time: new Date().toISOString(),
            read: false,
            icon: '🎉'
        },
        {
            id: 2,
            type: 'reminder',
            title: 'Learning Reminder',
            message: 'Don\'t forget to continue your video course today!',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            icon: '📚'
        },
        {
            id: 3,
            type: 'security',
            title: 'New Sign-In',
            message: 'Your account was accessed from a new device.',
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read: true,
            icon: '🔐'
        }
    ])

    const unreadCount = notifications.filter(n => !n.read).length

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            time: new Date().toISOString(),
            read: false,
            ...notification
        }
        setNotifications(prev => [newNotification, ...prev])
    }

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        )
    }

    const deleteNotification = (id) => {
        setNotifications(prev =>
            prev.filter(notification => notification.id !== id)
        )
    }

    const clearAllNotifications = () => {
        setNotifications([])
    }

    // Simulate real-time notifications
    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly add notifications for demo purposes
            const randomNotifications = [
                {
                    type: 'achievement',
                    title: 'Course Progress',
                    message: 'You\'ve completed 25% of your current playlist!',
                    icon: '⭐'
                },
                {
                    type: 'reminder',
                    title: 'Study Break',
                    message: 'Take a 5-minute break and come back refreshed!',
                    icon: '☕'
                },
                {
                    type: 'update',
                    title: 'New Feature',
                    message: 'Check out the new analytics dashboard!',
                    icon: '🚀'
                }
            ]

            if (Math.random() < 0.1) { // 10% chance every 30 seconds
                const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
                addNotification(randomNotification)
            }
        }, 30000) // Check every 30 seconds

        return () => clearInterval(interval)
    }, [])

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
} 