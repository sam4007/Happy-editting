import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useFriends } from '../contexts/FriendsContext'
import { useAuth } from '../contexts/AuthContext'
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
import { Send, User, ArrowLeft, Smile, MessageCircle } from 'lucide-react'

const Messages = () => {
    const { friendId } = useParams()
    const { user } = useAuth()
    const { friends } = useFriends()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const messagesEndRef = useRef(null)
    const emojiPickerRef = useRef(null)

    const friend = friends.find(f => f.id === friendId)

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

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false)
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

    if (!friend) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header - Premium and Minimal */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-16 z-20">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => window.location.href = '/friends'}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="relative">
                        {friend.photoURL ? (
                            <img
                                src={friend.photoURL}
                                alt={friend.displayName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {friend.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{friend.displayName}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Online</p>
                    </div>
                </div>
            </div>

            {/* Messages Area - Clean and Minimal */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-4">
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
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Start a conversation with {friend.displayName}</p>
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
                                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative ${item.senderId === user.uid
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <p className="text-sm">{item.message}</p>
                                        <div className={`text-xs mt-1 flex items-center justify-between ${item.senderId === user.uid
                                                ? 'text-blue-100'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}>
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

            {/* Message Input - Clean and Minimal */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-h-48 overflow-y-auto"
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