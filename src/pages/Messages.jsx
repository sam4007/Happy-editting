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
import { Send, User, ArrowLeft, Smile, MessageCircle, Palette, Upload, X, Crop, Check } from 'lucide-react'

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
    const [customColors, setCustomColors] = useState({
        sentMessage: '#3B82F6',
        receivedMessage: '#F3F4F6',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    })
    const [showCropModal, setShowCropModal] = useState(false)
    const [cropImage, setCropImage] = useState(null)
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const messagesEndRef = useRef(null)
    const emojiPickerRef = useRef(null)
    const themePickerRef = useRef(null)
    const fileInputRef = useRef(null)
    const cropContainerRef = useRef(null)
    const cropImageRef = useRef(null)

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

    // Predefined themes
    const themes = {
        default: {
            name: 'Default',
            sentMessage: '#3B82F6',
            receivedMessage: '#F3F4F6',
            background: darkMode ? '#000000' : '#ffffff',
            darkBackground: '#000000'
        },
        ocean: {
            name: 'Ocean',
            sentMessage: '#0ea5e9',
            receivedMessage: '#e0f2fe',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            darkBackground: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)'
        },
        sunset: {
            name: 'Sunset',
            sentMessage: '#f97316',
            receivedMessage: '#fed7aa',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            darkBackground: 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)'
        },
        forest: {
            name: 'Forest',
            sentMessage: '#16a34a',
            receivedMessage: '#dcfce7',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            darkBackground: 'linear-gradient(135deg, #14532d 0%, #166534 100%)'
        },
        lavender: {
            name: 'Lavender',
            sentMessage: '#8b5cf6',
            receivedMessage: '#ede9fe',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            darkBackground: 'linear-gradient(135deg, #581c87 0%, #6d28d9 100%)'
        },
        rose: {
            name: 'Rose',
            sentMessage: '#ec4899',
            receivedMessage: '#fce7f3',
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            darkBackground: 'linear-gradient(135deg, #9d174d 0%, #be185d 100%)'
        }
    }

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

    // Global mouse event listeners for cropping
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (isDragging) {
                handleMouseMove(e)
            }
        }

        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleMouseUp()
            }
        }

        if (showCropModal) {
            document.addEventListener('mousemove', handleGlobalMouseMove)
            document.addEventListener('mouseup', handleGlobalMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
        }
    }, [isDragging, showCropModal])

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji)
        setShowEmojiPicker(false)
    }

    // Handle theme selection
    const handleThemeSelect = (themeKey) => {
        setSelectedTheme(themeKey)
        setShowThemePicker(false)
    }

    // Handle custom wallpaper upload
    const handleWallpaperUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setCropImage(e.target.result)
                setShowCropModal(true)
            }
            reader.readAsDataURL(file)
        }
    }

    // Initialize crop area when image loads
    const handleImageLoad = () => {
        if (cropImageRef.current && cropContainerRef.current) {
            const container = cropContainerRef.current
            const image = cropImageRef.current
            const containerRect = container.getBoundingClientRect()
            const imageRect = image.getBoundingClientRect()

            // Calculate crop area to fit container aspect ratio
            const containerAspect = containerRect.width / containerRect.height
            const imageAspect = imageRect.width / imageRect.height

            let cropWidth, cropHeight

            if (imageAspect > containerAspect) {
                // Image is wider, crop width
                cropHeight = imageRect.height
                cropWidth = imageRect.height * containerAspect
            } else {
                // Image is taller, crop height
                cropWidth = imageRect.width
                cropHeight = imageRect.width / containerAspect
            }

            const cropX = (imageRect.width - cropWidth) / 2
            const cropY = (imageRect.height - cropHeight) / 2

            setCropArea({
                x: cropX,
                y: cropY,
                width: cropWidth,
                height: cropHeight
            })
        }
    }

    // Handle crop area dragging
    const handleMouseDown = (e) => {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({
            x: e.clientX - cropArea.x,
            y: e.clientY - cropArea.y
        })
    }

    const handleMouseMove = (e) => {
        if (!isDragging) return

        e.preventDefault()
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y

        if (cropImageRef.current) {
            const imageRect = cropImageRef.current.getBoundingClientRect()
            const maxX = imageRect.width - cropArea.width
            const maxY = imageRect.height - cropArea.height

            setCropArea(prev => ({
                ...prev,
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            }))
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Apply crop and set wallpaper
    const applyCrop = () => {
        if (cropImageRef.current) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const image = cropImageRef.current

            // Set canvas size to crop dimensions
            canvas.width = cropArea.width
            canvas.height = cropArea.height

            // Draw cropped portion
            ctx.drawImage(
                image,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, cropArea.width, cropArea.height
            )

            // Convert to data URL and set as wallpaper
            const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
            setCustomWallpaper(croppedImage)
            setSelectedTheme('custom')
            setShowCropModal(false)
            setCropImage(null)
        }
    }

    // Cancel crop
    const cancelCrop = () => {
        setShowCropModal(false)
        setCropImage(null)
        setCropArea({ x: 0, y: 0, width: 0, height: 0 })
    }

    // Handle custom color changes
    const handleCustomColorChange = (type, value) => {
        setCustomColors(prev => ({
            ...prev,
            [type]: value
        }))
        setSelectedTheme('custom')
    }

    // Get current theme colors
    const getCurrentTheme = () => {
        if (selectedTheme === 'custom') {
            return customColors
        }
        return themes[selectedTheme] || themes.default
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

    const currentTheme = getCurrentTheme()
    const backgroundStyle = customWallpaper
        ? {
            backgroundImage: `url(${customWallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }
        : { background: currentTheme.background }

    return (
        <div className="h-full flex flex-col" style={backgroundStyle}>
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

                    {/* Theme Button */}
                    <button
                        onClick={() => setShowThemePicker(!showThemePicker)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Messages Area - Clean and Minimal */}
            <div className="flex-1 overflow-y-auto pt-16 pb-20" style={{ background: 'transparent' }}>
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400 rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Start a conversation with {friendData.displayName}</p>
                    </div>
                ) : (
                    <div className="px-4 space-y-3">
                        {getMessagesWithDateSeparators(messages).map((item) => {
                            if (item.type === 'date-separator') {
                                return (
                                    <div key={item.id} className="flex justify-center my-4">
                                        <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
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

                {/* Theme Picker */}
                {showThemePicker && (
                    <div
                        ref={themePickerRef}
                        className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-10"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Theme</h3>
                                <button
                                    onClick={() => setShowThemePicker(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Predefined Themes */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Predefined Themes</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(themes).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleThemeSelect(key)}
                                            className={`p-3 rounded-lg border-2 transition-all ${selectedTheme === key
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="w-full h-8 rounded mb-2"
                                                style={{ background: theme.background }}
                                            ></div>
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{theme.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Theme */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Theme</h4>
                                <div className="space-y-3">
                                    {/* Custom Wallpaper */}
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Wallpaper</label>
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
                                                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span>Upload Image</span>
                                            </button>
                                            {customWallpaper && (
                                                <button
                                                    onClick={() => setCustomWallpaper(null)}
                                                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Colors */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Sent Message</label>
                                            <input
                                                type="color"
                                                value={customColors.sentMessage}
                                                onChange={(e) => handleCustomColorChange('sentMessage', e.target.value)}
                                                className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Received Message</label>
                                            <input
                                                type="color"
                                                value={customColors.receivedMessage}
                                                onChange={(e) => handleCustomColorChange('receivedMessage', e.target.value)}
                                                className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
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

            {/* Crop Modal */}
            {showCropModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Crop Wallpaper</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Drag the crop area to select which part of the image to use as your wallpaper.
                                </p>
                            </div>
                            <button
                                onClick={cancelCrop}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex">
                            {/* Image Area */}
                            <div className="flex-1 p-6">
                                <div
                                    ref={cropContainerRef}
                                    className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
                                    style={{ aspectRatio: '16/9' }}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    {cropImage && (
                                        <>
                                            <img
                                                ref={cropImageRef}
                                                src={cropImage}
                                                alt="Crop preview"
                                                className="w-full h-full object-contain"
                                                onLoad={handleImageLoad}
                                                draggable={false}
                                            />

                                            {/* Dark overlay outside crop area */}
                                            <div className="absolute inset-0 bg-black/50">
                                                <div
                                                    className="absolute border-2 border-white shadow-2xl cursor-move select-none"
                                                    style={{
                                                        left: `${cropArea.x}px`,
                                                        top: `${cropArea.y}px`,
                                                        width: `${cropArea.width}px`,
                                                        height: `${cropArea.height}px`,
                                                        pointerEvents: 'auto',
                                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                                                    }}
                                                    onMouseDown={handleMouseDown}
                                                >
                                                    {/* Corner handles */}
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full border-2 border-blue-500"></div>
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-blue-500"></div>
                                                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full border-2 border-blue-500"></div>
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-blue-500"></div>

                                                    {/* Center guides */}
                                                    <div className="absolute top-1/2 left-0 w-full h-px bg-white/30 transform -translate-y-1/2"></div>
                                                    <div className="absolute left-1/2 top-0 w-px h-full bg-white/30 transform -translate-x-1/2"></div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Tools Panel */}
                            <div className="w-64 p-6 border-l border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Crop Tools</h4>

                                <div className="space-y-4">
                                    {/* Aspect Ratio */}
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Aspect Ratio</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                                                16:9
                                            </button>
                                            <button className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                                                4:3
                                            </button>
                                        </div>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Zoom</label>
                                        <div className="flex items-center space-x-2">
                                            <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                                <span className="text-sm">-</span>
                                            </button>
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
                                            </div>
                                            <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                                <span className="text-sm">+</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rotation */}
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Rotation</label>
                                        <button className="w-full px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                                            <span className="mr-2">↻</span>
                                            Rotate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Upload Again
                            </button>
                            <button
                                onClick={applyCrop}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                <span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Messages 