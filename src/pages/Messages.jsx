import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useFriends } from '../contexts/FriendsContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    writeBatch
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Send, User, ArrowLeft, Smile, MessageCircle, Palette, Upload, X } from 'lucide-react'

const Messages = () => {
    const { friendId } = useParams()
    const { user } = useAuth()
    const { friends } = useFriends()
    const { darkMode } = useTheme()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false) // Start with false for faster initial render
    const [friendData, setFriendData] = useState(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showThemePicker, setShowThemePicker] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState('default')
    const [customWallpaper, setCustomWallpaper] = useState(null)
    const [wallpaperStatus, setWallpaperStatus] = useState('') // 'saving', 'saved', 'loading', 'error'
    const [wallpaperError, setWallpaperError] = useState('') // Store specific error message
    const [customColors, setCustomColors] = useState({
        sentMessage: '#3B82F6',
        receivedMessage: '#F3F4F6',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    })

    // Wrapper functions to save to localStorage when state changes
    const saveWallpaper = (wallpaper) => {
        console.log('saveWallpaper called with:', {
            wallpaper: wallpaper ? 'data present' : 'null',
            friendId: friendId,
            wallpaperLength: wallpaper ? wallpaper.length : 0
        })

        if (!friendId) {
            console.error('Cannot save wallpaper: friendId is null')
            setWallpaperStatus('error')
            return
        }

        if (!wallpaper) {
            console.log('Removing wallpaper for friendId:', friendId)
            setWallpaperStatus('saving')
            try {
                localStorage.removeItem(`wallpaper_${friendId}`)
                console.log('Wallpaper removed from localStorage successfully')
                setCustomWallpaper(null)
                setWallpaperStatus('saved')
                setTimeout(() => setWallpaperStatus(''), 2000)
            } catch (error) {
                console.error('Error removing wallpaper from localStorage:', error)
                setWallpaperStatus('error')
                setTimeout(() => setWallpaperStatus(''), 3000)
            }
            return
        }

        console.log('Saving wallpaper for friendId:', friendId, 'Data length:', wallpaper.length)
        setWallpaperStatus('saving')

        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                throw new Error('localStorage is not available')
            }

            // Check if the wallpaper data is too large for localStorage
            const wallpaperSize = wallpaper.length
            const maxSize = 5 * 1024 * 1024 // 5MB limit for localStorage

            if (wallpaperSize > maxSize) {
                throw new Error(`Wallpaper is too large (${(wallpaperSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`)
            }

            console.log('Wallpaper size check passed:', (wallpaperSize / 1024).toFixed(2) + 'KB')

            // Try to save the wallpaper
            localStorage.setItem(`wallpaper_${friendId}`, wallpaper)
            console.log('Wallpaper saved to localStorage successfully')

            // Verify it was saved
            const saved = localStorage.getItem(`wallpaper_${friendId}`)
            if (saved === wallpaper) {
                console.log('Wallpaper verification successful')
                setCustomWallpaper(wallpaper)
                setWallpaperStatus('saved')
            } else {
                throw new Error('Wallpaper verification failed - saved data does not match')
            }

            // Clear status after a delay
            setTimeout(() => setWallpaperStatus(''), 2000)
        } catch (error) {
            console.error('Error saving wallpaper to localStorage:', error)
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            })
            setWallpaperError(error.message)
            setWallpaperStatus('error')
            setTimeout(() => {
                setWallpaperStatus('')
                setWallpaperError('')
            }, 5000)
        }
    }

    const saveColors = (colors) => {
        if (!friendId) {
            console.error('Cannot save colors: friendId is null')
            return
        }

        console.log('Saving colors for friendId:', friendId, colors)

        try {
            localStorage.setItem(`colors_${friendId}`, JSON.stringify(colors))
            console.log('Colors saved to localStorage successfully')
            setCustomColors(colors)
        } catch (error) {
            console.error('Error saving colors to localStorage:', error)
        }
    }

    const fileInputRef = useRef(null)
    const themePickerRef = useRef(null)
    const messagesEndRef = useRef(null)
    const emojiPickerRef = useRef(null)

    // Optimize friend finding - use memoization and early return
    const friend = React.useMemo(() => {
        if (!friends || friends.length === 0) return null
        return friends.find(f => f.id === friendId)
    }, [friends, friendId])

    // Set friend data immediately when found
    React.useEffect(() => {
        if (friend) {
            setFriendData(friend)
        }
    }, [friend])

    // Handle custom color changes
    const handleCustomColorChange = (type, value) => {
        const newColors = {
            ...customColors,
            [type]: value
        }
        saveColors(newColors)
        setSelectedTheme('custom')
    }

    // Get current theme colors
    const getCurrentTheme = () => {
        console.log('getCurrentTheme called - customWallpaper:', customWallpaper ? 'exists' : 'null', 'customColors:', customColors)

        if (customWallpaper) {
            const theme = {
                background: `url(${customWallpaper}) center/cover fixed`,
                sentMessage: customColors.sentMessage,
                receivedMessage: customColors.receivedMessage
            }
            console.log('Returning custom theme:', theme)
            return theme
        }

        console.log('Returning default theme:', defaultTheme)
        return defaultTheme
    }

    // Default theme that adapts to light/dark mode
    const defaultTheme = {
        background: darkMode
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        sentMessage: '#3B82F6',
        receivedMessage: darkMode ? '#374151' : '#F3F4F6'
    }

    // Immediate wallpaper check when component mounts
    React.useEffect(() => {
        if (friendId) {
            console.log('Component mounted, checking for saved wallpaper...')
            const savedWallpaper = localStorage.getItem(`wallpaper_${friendId}`)
            if (savedWallpaper && !customWallpaper) {
                console.log('Found wallpaper on mount, setting it...')
                setCustomWallpaper(savedWallpaper)
            }
        }
    }, []) // Empty dependency array - runs only on mount

    // Reload wallpaper and colors when friendId changes
    React.useEffect(() => {
        if (!friendId) {
            console.log('friendId not available yet, skipping wallpaper/colors load')
            return
        }

        console.log('Loading wallpaper and colors for friendId:', friendId)

        try {
            // Load wallpaper from localStorage for this specific friend
            const savedWallpaper = localStorage.getItem(`wallpaper_${friendId}`)
            if (savedWallpaper) {
                console.log('Found saved wallpaper:', savedWallpaper.substring(0, 50) + '...')
                setCustomWallpaper(savedWallpaper)
            } else {
                console.log('No saved wallpaper found')
                setCustomWallpaper(null)
            }

            // Load colors from localStorage for this specific friend
            const savedColors = localStorage.getItem(`colors_${friendId}`)
            if (savedColors) {
                console.log('Found saved colors:', savedColors)
                setCustomColors(JSON.parse(savedColors))
            } else {
                console.log('No saved colors found, using defaults')
                setCustomColors({
                    sentMessage: '#3B82F6',
                    receivedMessage: '#F3F4F6',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                })
            }
        } catch (error) {
            console.error('Error loading wallpaper/colors:', error)
            // Reset to defaults on error
            setCustomWallpaper(null)
            setCustomColors({
                sentMessage: '#3B82F6',
                receivedMessage: '#F3F4F6',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            })
        }
    }, [friendId])

    // Additional effect to ensure wallpaper is loaded after friendId is available
    React.useEffect(() => {
        if (!friendId || !friend) return

        console.log('Friend data available, ensuring wallpaper is loaded for:', friendId)

        // Double-check if we have wallpaper but it's not in state
        const savedWallpaper = localStorage.getItem(`wallpaper_${friendId}`)
        if (savedWallpaper && !customWallpaper) {
            console.log('Found wallpaper in localStorage but not in state, restoring...')
            setCustomWallpaper(savedWallpaper)
        }

        // Double-check if we have colors but they're not in state
        const savedColors = localStorage.getItem(`colors_${friendId}`)
        if (savedColors && (!customColors || customColors.sentMessage === '#3B82F6')) {
            console.log('Found colors in localStorage but not in state, restoring...')
            try {
                setCustomColors(JSON.parse(savedColors))
            } catch (error) {
                console.error('Error parsing saved colors:', error)
            }
        }
    }, [friendId, friend, customWallpaper, customColors])

    // Debug effect to log state changes
    React.useEffect(() => {
        console.log('customWallpaper state changed:', customWallpaper ? 'exists' : 'null')
    }, [customWallpaper])

    React.useEffect(() => {
        console.log('customColors state changed:', customColors)
    }, [customColors])

    // Use useMemo to recalculate theme whenever dependencies change
    const currentTheme = React.useMemo(() => {
        console.log('Recalculating theme - customWallpaper:', customWallpaper ? 'exists' : 'null', 'customColors:', customColors)
        return getCurrentTheme()
    }, [customWallpaper, customColors])

    // Force re-render when theme changes by using state
    const [backgroundStyle, setBackgroundStyle] = React.useState({})

    React.useEffect(() => {
        console.log('Updating background style - customWallpaper:', customWallpaper ? 'exists' : 'null')

        const newStyle = customWallpaper
            ? {
                backgroundImage: `url(${customWallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }
            : { background: currentTheme.background }

        console.log('Setting new background style:', newStyle)
        setBackgroundStyle(newStyle)
    }, [customWallpaper, currentTheme.background])

    // Debug effect to log currentTheme changes
    React.useEffect(() => {
        console.log('currentTheme changed:', currentTheme)
    }, [currentTheme])

    // Debug effect to log backgroundStyle changes
    React.useEffect(() => {
        console.log('backgroundStyle changed:', backgroundStyle)
    }, [backgroundStyle])

    // Common emojis for the picker
    const commonEmojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
        '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
        '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
        '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
        '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
        '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
        '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
        '👍', '👎', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
        '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙',
        '💪', '🖕', '✍️', '🙏', '🦶', '🦵', '💄', '💋', '👄', '🦷',
        '👅', '👂', '🦻', '👃', '👣', '👁', '👀', '🧠', '🗣', '👤',
        '👥', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✨', '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍭',
        '🍬', '🍫', '🍿', '🍩', '🍪', '🎵', '🎶', '🎼', '🎤', '🎧',
        '📱', '💻', '⌨️', '🖥', '🖨', '📞', '📟', '📠', '📺', '📻'
    ]

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Close emoji picker and theme picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false)
            }
            if (themePickerRef.current && !themePickerRef.current.contains(event.target)) {
                setShowThemePicker(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji)
        setShowEmojiPicker(false)
    }

    // Handle theme selection (now only default theme)
    const handleThemeSelect = () => {
        setSelectedTheme('default')
        setShowThemePicker(false)
    }

    // Function to compress image if it's too large
    const compressImage = (dataUrl, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                // Calculate new dimensions
                let { width, height } = img
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height
                    height = maxHeight
                }

                canvas.width = width
                canvas.height = height

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)

                console.log('Image compressed from', (dataUrl.length / 1024).toFixed(2) + 'KB to', (compressedDataUrl.length / 1024).toFixed(2) + 'KB')
                resolve(compressedDataUrl)
            }
            img.onerror = reject
            img.src = dataUrl
        })
    }

    // Handle custom wallpaper upload
    const handleWallpaperUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
            console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
            console.log('Current friendId:', friendId)
            console.log('Current friend data:', friend)

            if (!friendId) {
                console.error('friendId is not available, cannot save wallpaper')
                setWallpaperStatus('error')
                return
            }

            const reader = new FileReader()
            reader.onload = async (e) => {
                console.log('File read successfully, data length:', e.target.result.length)
                console.log('About to save wallpaper for friendId:', friendId)

                try {
                    setWallpaperStatus('saving')

                    // Compress image if it's too large
                    let wallpaperData = e.target.result
                    if (wallpaperData.length > 2 * 1024 * 1024) { // If larger than 2MB
                        console.log('Image is large, compressing...')
                        wallpaperData = await compressImage(wallpaperData)
                    }

                    // Save the wallpaper
                    saveWallpaper(wallpaperData)
                } catch (error) {
                    console.error('Error processing wallpaper:', error)
                    setWallpaperStatus('error')
                    setTimeout(() => setWallpaperStatus(''), 3000)
                }
            }
            reader.onerror = (error) => {
                console.error('Error reading file:', error)
                setWallpaperStatus('error')
                setTimeout(() => setWallpaperStatus(''), 3000)
            }
            reader.readAsDataURL(file)
        }
    }

    // Mark messages as seen when user opens the chat
    const markMessagesAsSeen = async (messagesList) => {
        if (!user || !friendId || !messagesList.length) return

        try {
            const batch = writeBatch(db)

            // Mark messages that were sent TO the current user as seen
            const unseenMessages = messagesList.filter(msg =>
                msg.senderId !== user.uid && msg.status === 'sent'
            )

            unseenMessages.forEach(msg => {
                const messageRef = doc(db, 'messages', msg.id)
                batch.update(messageRef, {
                    status: 'seen',
                    seenAt: serverTimestamp()
                })
            })

            if (unseenMessages.length > 0) {
                await batch.commit()
            }
        } catch (error) {
            console.error('Error marking messages as seen:', error)
        }
    }

    useEffect(() => {
        if (!user || !friendId) return

        const chatId = [user.uid, friendId].sort().join('_')

        // Query messages and listen for real-time updates
        const messagesQuery = query(
            collection(db, 'messages'),
            where('chatId', '==', chatId)
        )

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesList = []
            snapshot.forEach((doc) => {
                const docData = { id: doc.id, ...doc.data() }
                messagesList.push(docData)
            })

            // Sort on client side by timestamp
            messagesList.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0
                return a.timestamp.toMillis() - b.timestamp.toMillis()
            })

            setMessages(messagesList)
            setLoading(false)

            // Mark messages as seen when they're loaded (only once when opening chat)
            markMessagesAsSeen(messagesList)
        })

        return () => unsubscribe()
    }, [user, friendId])

    // Additional effect to mark messages as seen when the component mounts
    useEffect(() => {
        if (!user || !friendId || messages.length === 0) return

        // Mark messages as seen when chat is opened
        markMessagesAsSeen(messages)
    }, [user, friendId]) // Only run when user or friendId changes (chat opens)

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !user || !friendId) return

        const chatId = [user.uid, friendId].sort().join('_')

        try {
            await addDoc(collection(db, 'messages'), {
                chatId,
                senderId: user.uid,
                senderName: user.displayName,
                receiverId: friendId,
                message: newMessage.trim(),
                timestamp: serverTimestamp(),
                status: 'sent', // Initial status is 'sent'
                seenAt: null
            })

            setNewMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp.toDate()
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()

        if (isToday) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            })
        }
    }

    const getMessageStatus = (message) => {
        // Only show status for messages sent by current user
        if (message.senderId !== user.uid) return null

        return message.status === 'seen' ? 'Seen' : 'Sent'
    }

    // Helper function to format date separators
    const formatDateSeparator = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp.toDate()
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === now.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
    }

    // Helper function to check if two dates are on different days
    const isDifferentDay = (timestamp1, timestamp2) => {
        if (!timestamp1 || !timestamp2) return false
        return timestamp1.toDate().toDateString() !== timestamp2.toDate().toDateString()
    }

    // Group messages with date separators
    const getMessagesWithDateSeparators = (messages) => {
        const messagesWithSeparators = []

        messages.forEach((message, index) => {
            const previousMessage = messages[index - 1]

            // Add date separator if this is the first message or if it's a different day
            if (index === 0 || isDifferentDay(previousMessage.timestamp, message.timestamp)) {
                messagesWithSeparators.push({
                    type: 'date-separator',
                    id: `date-${message.id}`,
                    timestamp: message.timestamp
                })
            }

            messagesWithSeparators.push({
                type: 'message',
                ...message
            })
        })

        return messagesWithSeparators
    }

    // Show loading only if friends are still loading and we don't have friend data yet
    if (!friendData && (!friends || friends.length === 0)) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                {/* Modern Minimal Loading */}
                <div className="flex flex-col items-center space-y-8">
                    {/* Clean Spinner */}
                    <div className="relative">
                        <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>

                    {/* Simple Text */}
                    <div className="text-center">
                        <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">Loading conversation...</h3>
                    </div>
                </div>
            </div>
        )
    }

    // Show error if friends loaded but friend not found
    if (friends && friends.length > 0 && !friendData) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Friend not found or not in your friends list.</p>
                    <button
                        onClick={() => window.location.href = '/friends'}
                        className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Friends</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col" style={backgroundStyle}>
            {/* Header - Premium and Minimal - Fixed to Viewport Top */}
            <div className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 fixed top-14 left-0 right-0 lg:left-64 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.location.href = '/friends'}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="relative">
                            {friendData.photoURL ? (
                                <img
                                    src={friendData.photoURL}
                                    alt={friendData.displayName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {friendData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{friendData.displayName}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Online</p>
                        </div>
                    </div>

                    {/* Theme Button with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowThemePicker(!showThemePicker)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Theme Picker Dropdown */}
                        {showThemePicker && (
                            <div
                                ref={themePickerRef}
                                className="absolute top-full right-0 mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-600 rounded-xl shadow-lg p-4 w-72 z-50 animate-in slide-in-from-top-2 duration-200"
                            >
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-600">
                                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Theme</h3>
                                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                                    </div>

                                    {/* Wallpaper Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Background</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleWallpaperUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                                            >
                                                Upload
                                            </button>
                                            <button
                                                onClick={() => saveWallpaper(null)}
                                                className="px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        {/* Status Indicator */}
                                        {wallpaperStatus && (
                                            <div className={`text-xs px-2 py-1 rounded-md ${wallpaperStatus === 'saving' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                                                wallpaperStatus === 'saved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                                    wallpaperStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                                                        'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {wallpaperStatus === 'saving' && 'Saving wallpaper...'}
                                                {wallpaperStatus === 'saved' && 'Wallpaper saved successfully!'}
                                                {wallpaperStatus === 'error' && (
                                                    <div>
                                                        <div>Error saving wallpaper</div>
                                                        {wallpaperError && (
                                                            <div className="text-xs mt-1 opacity-75">{wallpaperError}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Colors Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-sm"></div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Colors</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="block text-xs text-gray-500 dark:text-gray-400">Sent</label>
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm"
                                                        style={{ backgroundColor: customColors.sentMessage }}
                                                    ></div>
                                                    <input
                                                        type="color"
                                                        value={customColors.sentMessage}
                                                        onChange={(e) => handleCustomColorChange('sentMessage', e.target.value)}
                                                        className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs text-gray-500 dark:text-gray-400">Received</label>
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm"
                                                        style={{ backgroundColor: customColors.receivedMessage }}
                                                    ></div>
                                                    <input
                                                        type="color"
                                                        value={customColors.receivedMessage}
                                                        onChange={(e) => handleCustomColorChange('receivedMessage', e.target.value)}
                                                        className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area - Clean and Minimal */}
            <div className="flex-1 overflow-y-auto pt-16 pb-20">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400 rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4">
                        <div className="w-16 h-16 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center text-sm">Start a conversation with {friendData.displayName}</p>
                    </div>
                ) : (
                    <div className="px-4 space-y-3">
                        {getMessagesWithDateSeparators(messages).map((item) => {
                            if (item.type === 'date-separator') {
                                return (
                                    <div key={item.id} className="flex justify-center my-4">
                                        <div className="px-3 py-1 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full">
                                            <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                                                {formatDateSeparator(item.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={`flex ${item.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative shadow-sm"
                                        style={{
                                            backgroundColor: item.senderId === user.uid
                                                ? currentTheme.sentMessage
                                                : currentTheme.receivedMessage,
                                            color: item.senderId === user.uid ? 'white' : '#374151'
                                        }}
                                    >
                                        <p className="text-sm">{item.message}</p>
                                        <div
                                            className="text-xs mt-1 flex items-center justify-between"
                                            style={{
                                                color: item.senderId === user.uid
                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                    : 'rgba(55, 65, 81, 0.6)'
                                            }}
                                        >
                                            <span>{formatTime(item.timestamp)}</span>
                                            {getMessageStatus(item) && (
                                                <span className="ml-2 text-xs opacity-75">
                                                    {getMessageStatus(item)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input - Clean and Minimal - Fixed to Viewport Bottom */}
            <div className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 fixed bottom-0 left-0 right-0 lg:left-64 z-50">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-h-48 overflow-y-auto z-10"
                    >
                        <div className="grid grid-cols-8 gap-1">
                            {commonEmojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}



                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <Smile className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                    >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Messages 