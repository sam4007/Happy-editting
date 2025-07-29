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
import { Send, User, ArrowLeft, Smile } from 'lucide-react'

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
            <div className="min-h-screen relative overflow-hidden bg-transparent p-6">
                {/* Premium Fixed Black Background */}
                <div className="fixed inset-0 z-0">
                    {/* Pitch Black Background */}
                    <div className="absolute inset-0 bg-black"></div>

                    {/* Subtle Texture for Premium Feel */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `
                            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
                            radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
                        `,
                        backgroundSize: '30px 30px, 50px 50px'
                    }}></div>

                    {/* Light Mode Override */}
                    <div className="absolute inset-0 bg-white dark:bg-transparent"></div>
                </div>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <p className="text-gray-500 dark:text-gray-400">Friend not found or not in your friends list.</p>
                        <button
                            onClick={() => window.location.href = '/friends'}
                            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Friends</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent lg:pl-64 flex flex-col">
            {/* Premium Fixed Black Background */}
            <div className="fixed inset-0 z-0">
                {/* Pitch Black Background */}
                <div className="absolute inset-0 bg-black"></div>

                {/* Subtle Texture for Premium Feel */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
                        radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
                    `,
                    backgroundSize: '30px 30px, 50px 50px'
                }}></div>

                {/* Light Mode Override */}
                <div className="absolute inset-0 bg-white dark:bg-transparent"></div>
            </div>
            {/* Header - Fixed below main app header */}
            <div className="sticky top-16 z-20 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => window.location.href = '/friends'}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">{friend.displayName}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{friend.email}</p>
                    </div>
                </div>
            </div>

            {/* Messages - Scrollable area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 modern-scrollbar bg-white dark:bg-gray-800">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No messages yet. Start a conversation!</p>
                    </div>
                ) : (
                    getMessagesWithDateSeparators(messages).map((item) => {
                        if (item.type === 'date-separator') {
                            return (
                                <div key={item.id} className="flex justify-center my-4">
                                    <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            {formatDateSeparator(item.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={item.id}
                                className={`flex ${item.senderId === user.uid ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${item.senderId === user.uid
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
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
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="sticky bottom-0 z-20 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto modern-scrollbar"
                    >
                        <div className="grid grid-cols-10 gap-2">
                            {commonEmojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
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
                            className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <Smile className="w-5 h-5" />
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