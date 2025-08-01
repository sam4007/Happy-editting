import React, { useState, useEffect } from 'react'
import { useFriends } from '../contexts/FriendsContext'
import { useAuth } from '../contexts/AuthContext'
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import {
    Search,
    Users,
    UserPlus,
    User,
    Check,
    X,
    MessageCircle,
    UserMinus,
    Mail,
    BookOpen,
    TrendingUp,
    Clock,
    Award,
    Calendar,
    Play,
    CheckCircle
} from 'lucide-react'

const Friends = () => {
    const { user } = useAuth()
    const {
        friends,
        friendRequests,
        sentRequests,
        loading,
        searchUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        testDatabaseStructure
    } = useFriends()

    const [activeTab, setActiveTab] = useState('friends')
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchError, setSearchError] = useState('')
    const [message, setMessage] = useState('')
    const [conversations, setConversations] = useState([])
    const [loadingConversations, setLoadingConversations] = useState(false)
    const [unreadConversations, setUnreadConversations] = useState(0)

    // Friend details modal state
    const [selectedFriend, setSelectedFriend] = useState(null)
    const [friendDetails, setFriendDetails] = useState(null)
    const [loadingFriendDetails, setLoadingFriendDetails] = useState(false)
    const [showFriendModal, setShowFriendModal] = useState(false)
    const [selectedFriendsFriends, setSelectedFriendsFriends] = useState([])
    const [loadingFriendsFriends, setLoadingFriendsFriends] = useState(false)
    const [currentConversation, setCurrentConversation] = useState(null)

    // Load conversations when Messages tab is active or when user changes
    useEffect(() => {
        if (user && friends.length > 0) {
            loadConversations()
        }
    }, [user, friends])

    // Real-time listener for conversations to update unread count
    useEffect(() => {
        if (!user) return

        const messagesRef = collection(db, 'messages')
        const q1 = query(messagesRef, where('senderId', '==', user.uid))
        const q2 = query(messagesRef, where('receiverId', '==', user.uid))

        const unsubscribe1 = onSnapshot(q1, (snapshot) => {
            console.log('📱 Real-time update - sent messages changed')
            if (friends.length > 0) {
                loadConversations()
            }
        })

        const unsubscribe2 = onSnapshot(q2, (snapshot) => {
            console.log('📱 Real-time update - received messages changed')
            if (friends.length > 0) {
                loadConversations()
            }
        })

        return () => {
            unsubscribe1()
            unsubscribe2()
        }
    }, [user, friends])

    // Load friend details when a friend is selected
    useEffect(() => {
        if (selectedFriend) {
            loadFriendDetails(selectedFriend)
            loadSelectedFriendsFriends(selectedFriend)
        }
    }, [selectedFriend])

    // Friends data is already loaded in real-time by the FriendsContext
    // No need for additional loading here as the context handles it

    const loadFriendDetails = async (friend) => {
        setLoadingFriendDetails(true)
        try {
            // Get friend's stats from Firestore users collection
            const friendRef = doc(db, 'users', friend.id)
            const friendSnap = await getDoc(friendRef)

            if (friendSnap.exists()) {
                const friendData = friendSnap.data()
                const friendStats = friendData.stats || {}

                console.log('Friend data loaded:', friendData)
                console.log('Friend stats:', friendStats)

                // Convert studyHours to totalWatchTime in seconds (approximate)
                const studyHours = friendStats.studyHours || 0
                const totalWatchTimeSeconds = studyHours * 3600 // Convert hours to seconds

                setFriendDetails({
                    friend,
                    stats: {
                        totalCourses: friendStats.totalCourses || 0,
                        completedCourses: friendStats.completedCourses || 0,
                        totalWatchTime: totalWatchTimeSeconds,
                        averageCompletion: friendStats.completionRate || 0,
                        studyHours: studyHours
                    },
                    courses: [], // Individual course data is stored locally, not available
                    hasDetailedCourses: false // Flag to show appropriate message
                })
            } else {
                console.log('Friend document not found in Firestore')
                setFriendDetails({
                    friend,
                    stats: {
                        totalCourses: 0,
                        completedCourses: 0,
                        totalWatchTime: 0,
                        averageCompletion: 0,
                        studyHours: 0
                    },
                    courses: [],
                    hasDetailedCourses: false
                })
            }
        } catch (error) {
            console.error('Error loading friend details:', error)
            setFriendDetails({
                friend,
                stats: {
                    totalCourses: 0,
                    completedCourses: 0,
                    totalWatchTime: 0,
                    averageCompletion: 0,
                    studyHours: 0
                },
                courses: [],
                hasDetailedCourses: false
            })
        }
        setLoadingFriendDetails(false)
    }

    const loadSelectedFriendsFriends = async (friend) => {
        setLoadingFriendsFriends(true)
        try {
            // Get the friend's friends list from their user document
            const friendRef = doc(db, 'users', friend.id)
            const friendSnap = await getDoc(friendRef)

            if (friendSnap.exists()) {
                const friendData = friendSnap.data()
                const friendsList = friendData.friends || []

                // Get detailed information for each friend
                const friendsDetails = []
                for (const friendId of friendsList) {
                    try {
                        const userRef = doc(db, 'users', friendId)
                        const userSnap = await getDoc(userRef)
                        if (userSnap.exists()) {
                            const userData = userSnap.data()
                            friendsDetails.push({
                                id: friendId,
                                displayName: userData.displayName || userData.email,
                                email: userData.email,
                                stats: userData.stats || {}
                            })
                        }
                    } catch (error) {
                        console.error('Error loading friend details:', error)
                    }
                }

                setSelectedFriendsFriends(friendsDetails)
            } else {
                setSelectedFriendsFriends([])
            }
        } catch (error) {
            console.error('Error loading friend\'s friends:', error)
            setSelectedFriendsFriends([])
        }
        setLoadingFriendsFriends(false)
    }

    const getFriendshipStatus = (friendId) => {
        // Check if this user is already our friend
        const isAlreadyFriend = friends.some(f => f.id === friendId)
        if (isAlreadyFriend) return 'friends'

        // Check if we've sent a friend request to this user
        const hasSentRequest = sentRequests.some(req => req.to === friendId)
        if (hasSentRequest) return 'pending'

        // Check if this user sent us a friend request
        const hasReceivedRequest = friendRequests.some(req => req.from === friendId)
        if (hasReceivedRequest) return 'received'

        // Check if this is the current user
        if (friendId === user?.uid) return 'self'

        return 'none'
    }

    const handleFollowUser = async (friendId) => {
        const status = getFriendshipStatus(friendId)

        if (status === 'none') {
            await handleSendRequest(friendId)
        } else if (status === 'friends') {
            await handleRemoveFriend(friendId)
            // Reload the selected friend's friends list to update the UI
            loadSelectedFriendsFriends(selectedFriend)
        }
    }

    const handleFriendClick = (friend) => {
        console.log('🎯 Friend clicked:', friend)
        console.log('📊 Friend stats:', friend.stats)
        setSelectedFriend(friend)
        setShowFriendModal(true)
    }

    const closeFriendModal = () => {
        setShowFriendModal(false)
        setSelectedFriend(null)
        setFriendDetails(null)
        setSelectedFriendsFriends([])
    }

    const formatDuration = (seconds) => {
        if (!seconds) return '0m'
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Never'
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const loadConversations = async () => {
        if (!user) return

        setLoadingConversations(true)
        try {
            const messagesRef = collection(db, 'messages')
            const q = query(
                messagesRef,
                where('senderId', '==', user.uid)
            )
            const q2 = query(
                messagesRef,
                where('receiverId', '==', user.uid)
            )

            const [sentSnapshot, receivedSnapshot] = await Promise.all([
                getDocs(q),
                getDocs(q2)
            ])

            const allMessages = []
            sentSnapshot.forEach(doc => allMessages.push({ id: doc.id, ...doc.data() }))
            receivedSnapshot.forEach(doc => allMessages.push({ id: doc.id, ...doc.data() }))

            // Group messages by chatId and get the latest message for each conversation
            const conversationMap = new Map()

            allMessages.forEach(msg => {
                const chatId = msg.chatId
                if (!conversationMap.has(chatId) ||
                    (msg.timestamp && conversationMap.get(chatId).timestamp &&
                        msg.timestamp.toMillis() > conversationMap.get(chatId).timestamp.toMillis())) {
                    conversationMap.set(chatId, msg)
                }
            })

            // Convert to array and get friend details for each conversation
            const conversationList = []
            console.log('📱 Available friends:', friends.length)
            for (const [chatId, latestMessage] of conversationMap) {
                const otherUserId = latestMessage.senderId === user.uid ? latestMessage.receiverId : latestMessage.senderId
                const friend = friends.find(f => f.id === otherUserId)

                if (friend) {
                    conversationList.push({
                        chatId,
                        friend,
                        latestMessage,
                        otherUserId
                    })
                } else {
                    console.log('📱 Friend not found for user:', otherUserId)
                }
            }

            // Sort by latest message timestamp
            conversationList.sort((a, b) => {
                if (!a.latestMessage.timestamp || !b.latestMessage.timestamp) return 0
                return b.latestMessage.timestamp.toMillis() - a.latestMessage.timestamp.toMillis()
            })

            // Count conversations with unread messages
            let unreadCount = 0
            conversationList.forEach(conversation => {
                const isUnread = conversation.latestMessage.senderId !== user.uid &&
                    conversation.latestMessage.status === 'sent'
                if (isUnread) {
                    unreadCount++
                }
            })

            console.log('📱 Loaded conversations:', conversationList.length)
            console.log('📱 Unread count:', unreadCount)
            setConversations(conversationList)
            setUnreadConversations(unreadCount)
        } catch (error) {
            console.error('Error loading conversations:', error)
        } finally {
            setLoadingConversations(false)
        }
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        setSearchError('')
        setSearchResults([])

        if (searchTerm.trim()) {
            try {
                console.log('🔍 Starting search for:', searchTerm)
                const results = await searchUsers(searchTerm)
                console.log('📊 Search completed. Results:', results)
                setSearchResults(results)

                if (results.length === 0) {
                    setSearchError('No users found. Try a different search term.')
                }
            } catch (error) {
                console.error('❌ Search failed:', error)
                setSearchError('Search failed: ' + error.message)
            }
        }
    }

    // Test database structure (temporary debug function)
    const handleTestDatabase = async () => {
        try {
            if (testDatabaseStructure) {
                await testDatabaseStructure()
                setMessage('Database test completed. Check console for details.')
            }
        } catch (error) {
            console.error('Database test failed:', error)
            setMessage('Database test failed: ' + error.message)
        }
        setTimeout(() => setMessage(''), 5000)
    }

    const handleSendRequest = async (friendId) => {
        const result = await sendFriendRequest(friendId)
        if (result.success) {
            setMessage('Friend request sent!')
        } else {
            setMessage(result.error)
        }
        setTimeout(() => setMessage(''), 3000)
    }

    const handleAcceptRequest = async (requestId, friendId) => {
        const result = await acceptFriendRequest(requestId, friendId)
        if (result.success) {
            setMessage('Friend request accepted!')
        } else {
            setMessage(result.error)
        }
        setTimeout(() => setMessage(''), 3000)
    }

    const handleRejectRequest = async (requestId) => {
        const result = await rejectFriendRequest(requestId)
        if (result.success) {
            setMessage('Friend request rejected')
        } else {
            setMessage(result.error)
        }
        setTimeout(() => setMessage(''), 3000)
    }

    const handleRemoveFriend = async (friendId) => {
        if (confirm('Are you sure you want to remove this friend?')) {
            const result = await removeFriend(friendId)
            if (result.success) {
                setMessage('Friend removed')
            } else {
                setMessage(result.error)
            }
            setTimeout(() => setMessage(''), 3000)
        }
    }

    const handleMessageFriend = async (friend) => {
        try {
            // Create or get existing chat ID
            const chatId = [user.uid, friend.id].sort().join('_')

            // Create a new conversation if it doesn't exist
            const conversationExists = conversations.find(conv => conv.chatId === chatId)

            if (!conversationExists) {
                // Add to conversations list
                const newConversation = {
                    chatId,
                    friend,
                    latestMessage: {
                        content: 'Start a conversation!',
                        timestamp: new Date().toISOString(),
                        senderId: user.uid
                    },
                    otherUserId: friend.id
                }
                setConversations(prev => [newConversation, ...prev])
            }

            // Set current conversation and navigate
            setCurrentConversation(friend)
            setMessage(`Opening chat with ${friend.displayName}...`)

            // Navigate to the DM
            setTimeout(() => {
                window.location.href = `/messages/${friend.id}`
            }, 500)

        } catch (error) {
            console.error('Error opening chat:', error)
            setMessage('Failed to open chat: ' + error.message)
            setTimeout(() => setMessage(''), 3000)
        }
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return ''

        let date
        try {
            // Check if it's a Firestore timestamp
            if (timestamp && typeof timestamp.toDate === 'function') {
                date = timestamp.toDate()
            } else if (timestamp instanceof Date) {
                date = timestamp
            } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
                date = new Date(timestamp)
            } else {
                return ''
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error)
            return ''
        }

        if (!date || isNaN(date.getTime())) return ''

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
                day: 'numeric'
            })
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent">
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

            {/* Main Content */}
            <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-none">
                                Friends
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">
                                Connect with fellow learners and share your progress
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Users className="w-8 h-8 text-indigo-500" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {friends.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className="glass-card-frosted p-6 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <p className="text-blue-700 dark:text-blue-300 font-medium">{message}</p>
                    </div>
                )}

                {/* Search Section */}
                <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-3 mb-4">
                        <Search className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Find Friends
                        </h2>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search users by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-premium w-full"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
                            <UserPlus className="w-5 h-5 text-green-500" />
                            <span>Search Results</span>
                        </h3>
                        <div className="space-y-3">
                            {searchResults.map(user => (
                                <div key={user.id} className="glass-card-frosted flex items-center justify-between p-4 rounded-xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center space-x-3">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || user.email}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white/20 dark:border-gray-700/50"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {(user.displayName || user.email)?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {user.displayName || user.email}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {getFriendshipStatus(user.id) === 'none' && (
                                            <button
                                                onClick={() => sendFriendRequest(user.id)}
                                                className="btn-primary text-sm"
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Add Friend
                                            </button>
                                        )}
                                        {getFriendshipStatus(user.id) === 'pending' && (
                                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                                                Request Sent
                                            </span>
                                        )}
                                        {getFriendshipStatus(user.id) === 'friends' && (
                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                                                Friends
                                            </span>
                                        )}
                                        {getFriendshipStatus(user.id) === 'received' && (
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => acceptFriendRequest(user.id)}
                                                    className="btn-primary text-sm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => rejectFriendRequest(user.id)}
                                                    className="btn-secondary text-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {getFriendshipStatus(user.id) === 'self' && (
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                                                You
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                    <div className="flex space-x-1 mb-6 p-1 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 shadow-lg">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative overflow-hidden group ${activeTab === 'friends'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transform scale-105'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                                }`}
                        >
                            <div className={`transition-all duration-300 ${activeTab === 'friends' ? 'text-white' : 'text-indigo-500 group-hover:text-indigo-600'}`}>
                                <Users className="w-4 h-4" />
                            </div>
                            <span>Friends ({friends.length})</span>
                            {activeTab === 'friends' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 animate-pulse"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative overflow-hidden group ${activeTab === 'requests'
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25 transform scale-105'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                                }`}
                        >
                            <div className={`transition-all duration-300 ${activeTab === 'requests' ? 'text-white' : 'text-orange-500 group-hover:text-orange-600'}`}>
                                <Mail className="w-4 h-4" />
                            </div>
                            <span>Requests ({friendRequests.length})</span>
                            {activeTab === 'requests' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 animate-pulse"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative overflow-hidden group ${activeTab === 'messages'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transform scale-105'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                                }`}
                        >
                            <div className={`transition-all duration-300 ${activeTab === 'messages' ? 'text-white' : 'text-emerald-500 group-hover:text-emerald-600'}`}>
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="relative">
                                Messages
                                {unreadConversations > 0 && (
                                    <div className="absolute -top-1 -right-6 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg shadow-red-500/50 z-[9999]">
                                        {unreadConversations}
                                    </div>
                                )}
                            </span>
                            {activeTab === 'messages' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 animate-pulse"></div>
                            )}
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'friends' && (
                        <div>
                            {friends.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No friends yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">Start building your learning network!</p>
                                    <button
                                        onClick={() => setActiveTab('search')}
                                        className="btn-primary"
                                    >
                                        Find Friends
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {friends.map(friend => (
                                        <div key={friend.id} className="glass-card-frosted group relative p-5 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => handleFriendClick(friend)}>
                                            {/* Remove Button - Absolutely Positioned */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeFriend(friend.id)
                                                }}
                                                className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-60 hover:opacity-100 z-10"
                                                title="Remove friend"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>

                                            {/* Header with Avatar */}
                                            <div className="flex items-center space-x-3 mb-4 pr-10">
                                                {friend.photoURL ? (
                                                    <img
                                                        src={friend.photoURL}
                                                        alt={friend.displayName}
                                                        className="w-12 h-12 rounded-xl object-cover shadow-lg border-2 border-white/20 dark:border-gray-700/50"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                                        <span className="text-white font-semibold text-lg">
                                                            {friend.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                        {friend.displayName}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {friend.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quick Stats */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {friend.stats?.totalCourses || friend.stats?.completedCourses || 0} courses
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {Math.round((friend.stats?.totalWatchTime || friend.stats?.studyHours * 3600 || 0) / 3600)}h study
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleMessageFriend(friend)
                                                }}
                                                className="w-full btn-primary text-sm py-2.5 rounded-xl hover:scale-[1.02] transition-transform"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2 inline" />
                                                Message
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                                        <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Friend Requests</h3>
                                </div>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full">
                                    {friendRequests.length} pending
                                </span>
                            </div>

                            {friendRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Friend Requests</h4>
                                    <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {friendRequests.map(request => (
                                        <div key={request.id} className="glass-card-frosted p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                                            <div className="flex items-center space-x-4">
                                                {/* Profile Picture */}
                                                {request.photoURL ? (
                                                    <div className="relative">
                                                        <img
                                                            src={request.photoURL}
                                                            alt={request.displayName || request.fromName}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                                                            <span className="text-white font-semibold text-lg">
                                                                {(request.displayName || request.fromName)?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                        {request.displayName || request.fromName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                                        {request.email || request.fromEmail}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Wants to connect
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request.id, request.from)}
                                                        className="w-full btn-primary text-sm py-2.5 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        <span>Accept</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        className="w-full btn-secondary text-sm py-2.5 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        <span>Decline</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="glass-card-frosted p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                                        <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h3>
                                </div>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full">
                                    {conversations.length} conversations
                                </span>
                            </div>

                            {loadingConversations ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-400 rounded-full animate-spin"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h4>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">Start messaging your friends!</p>
                                    <button
                                        onClick={() => setActiveTab('friends')}
                                        className="btn-primary text-sm py-2.5 rounded-xl hover:scale-[1.02] transition-transform"
                                    >
                                        View Friends
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {conversations.map(conversation => (
                                        <div
                                            key={conversation.chatId}
                                            className="glass-card-frosted p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
                                            onClick={async () => {
                                                // Mark messages as read when clicking on conversation
                                                if (conversation.latestMessage.senderId !== user.uid &&
                                                    conversation.latestMessage.status === 'sent') {
                                                    try {
                                                        const messageRef = doc(db, 'messages', conversation.latestMessage.id)
                                                        await updateDoc(messageRef, {
                                                            status: 'seen',
                                                            seenAt: serverTimestamp()
                                                        })
                                                    } catch (error) {
                                                        console.error('Error marking message as read:', error)
                                                    }
                                                }
                                                window.location.href = `/messages/${conversation.friend.id}`
                                            }}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    {conversation.friend.photoURL ? (
                                                        <img
                                                            src={conversation.friend.photoURL}
                                                            alt={conversation.friend.displayName}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                                                            <span className="text-white font-semibold text-lg">
                                                                {conversation.friend.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                            {conversation.friend.displayName}
                                                        </h4>
                                                        <div className="flex items-center space-x-2">
                                                            {conversation.latestMessage.senderId !== user.uid && conversation.latestMessage.status === 'sent' && (
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                            )}
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatTime(conversation.latestMessage.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {conversation.latestMessage.senderId === user.uid ? 'You: ' : ''}
                                                        {conversation.latestMessage.message}
                                                    </p>
                                                </div>

                                                <MessageCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Friend Details Modal */}
            {showFriendModal && selectedFriend && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeFriendModal}
                >
                    <div
                        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 dark:border-gray-700/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {selectedFriend.photoURL ? (
                                        <img
                                            src={selectedFriend.photoURL}
                                            alt={selectedFriend.displayName}
                                            className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white/20 dark:border-gray-700/50"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-xl">
                                                {selectedFriend.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                                            {selectedFriend.displayName}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {selectedFriend.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeFriendModal}
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {loadingFriendDetails ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading progress...</span>
                                </div>
                            ) : friendDetails ? (
                                <>
                                    {/* Progress Stats */}
                                    <div className="glass-card-frosted p-5 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Progress</h3>
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <BookOpen className="w-3 h-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{friendDetails.stats.totalCourses}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{friendDetails.stats.completedCourses}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                                                        <Clock className="w-3 h-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{friendDetails.stats.studyHours}h</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Study Time</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                                                        <Award className="w-3 h-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{friendDetails.stats.averageCompletion}%</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Completion</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Overall Progress</span>
                                                <span className="text-xs font-medium text-gray-900 dark:text-white">{friendDetails.stats.averageCompletion}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${friendDetails.stats.averageCompletion}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Friends Section */}
                                    <div className="glass-card-frosted p-5 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Friends ({selectedFriendsFriends.length})</h3>
                                        </div>

                                        {loadingFriendsFriends ? (
                                            <div className="flex justify-center items-center py-6">
                                                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                                            </div>
                                        ) : selectedFriendsFriends.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {selectedFriendsFriends.map(friend => {
                                                    const status = getFriendshipStatus(friend.id)
                                                    return (
                                                        <div key={friend.id} className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200">
                                                            <div className="flex items-center space-x-3">
                                                                {friend.photoURL ? (
                                                                    <img
                                                                        src={friend.photoURL}
                                                                        alt={friend.displayName}
                                                                        className="w-8 h-8 rounded-lg object-cover border-2 border-white/20 dark:border-gray-700/50"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                                                        <span className="text-white font-semibold text-sm">
                                                                            {friend.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{friend.displayName}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{friend.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                {status === 'self' ? (
                                                                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                                                                        You
                                                                    </span>
                                                                ) : status === 'friends' ? (
                                                                    <button
                                                                        onClick={() => handleFollowUser(friend.id)}
                                                                        className="flex items-center space-x-1 px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs transition-colors"
                                                                    >
                                                                        <UserMinus className="w-3 h-3" />
                                                                        <span>Unfollow</span>
                                                                    </button>
                                                                ) : status === 'pending' ? (
                                                                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                                                                        Pending
                                                                    </span>
                                                                ) : status === 'received' ? (
                                                                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                                                        Requests you
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleFollowUser(friend.id)}
                                                                        className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs transition-colors"
                                                                    >
                                                                        <UserPlus className="w-3 h-3" />
                                                                        <span>Follow</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No friends yet</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load data</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/10 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => window.location.href = `/messages/${selectedFriend.id}`}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Message</span>
                                </button>
                                <button
                                    onClick={closeFriendModal}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Friends 