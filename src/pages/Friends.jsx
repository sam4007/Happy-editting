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
    getDoc
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

    // Friend details modal state
    const [selectedFriend, setSelectedFriend] = useState(null)
    const [friendDetails, setFriendDetails] = useState(null)
    const [loadingFriendDetails, setLoadingFriendDetails] = useState(false)
    const [showFriendModal, setShowFriendModal] = useState(false)
    const [selectedFriendsFriends, setSelectedFriendsFriends] = useState([])
    const [loadingFriendsFriends, setLoadingFriendsFriends] = useState(false)

    // Load conversations when Messages tab is active
    useEffect(() => {
        if (activeTab === 'messages' && user) {
            loadConversations()
        }
    }, [activeTab, user])

    // Load friend details when a friend is selected
    useEffect(() => {
        if (selectedFriend) {
            loadFriendDetails(selectedFriend)
            loadSelectedFriendsFriends(selectedFriend)
        }
    }, [selectedFriend])

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
                }
            }

            // Sort by latest message timestamp
            conversationList.sort((a, b) => {
                if (!a.latestMessage.timestamp || !b.latestMessage.timestamp) return 0
                return b.latestMessage.timestamp.toMillis() - a.latestMessage.timestamp.toMillis()
            })

            setConversations(conversationList)
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
                day: 'numeric'
            })
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 lg:pl-64">
            <div className="p-6 space-y-8">
                {/* Header */}
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Friends
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
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
                    <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20">
                        <p className="text-blue-700 dark:text-blue-300 font-medium">{message}</p>
                    </div>
                )}

                {/* Search Section */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Search className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Find Friends
                        </h2>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-premium pl-10"
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
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
                            <UserPlus className="w-5 h-5 text-green-500" />
                            <span>Search Results</span>
                        </h3>
                        <div className="space-y-3">
                            {searchResults.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
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
                <div className="glass-card p-6">
                    <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === 'friends'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Friends ({friends.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === 'requests'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Mail className="w-4 h-4" />
                            <span>Requests ({friendRequests.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === 'messages'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Messages ({conversations.length})</span>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {friends.map(friend => (
                                        <div key={friend.id} className="group relative p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleFriendClick(friend)}>
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <User className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {friend.displayName}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {friend.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Friend Stats */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                                        {friend.stats?.totalCourses || 0}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Courses</div>
                                                </div>
                                                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                                        {Math.round((friend.stats?.totalWatchTime || 0) / 3600)}h
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Study Time</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        // Handle message functionality
                                                    }}
                                                    className="flex-1 btn-primary text-sm"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                    Message
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeFriend(friend.id)
                                                    }}
                                                    className="btn-secondary text-sm px-3"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div>
                            {friendRequests.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No friend requests</h3>
                                    <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {friendRequests.map(request => (
                                        <div key={request.id} className="p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                                                        <User className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">{request.fromName}</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{request.fromEmail}</p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                            Wants to connect with you
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request.id, request.from)}
                                                        className="btn-primary text-sm"
                                                    >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        className="btn-secondary text-sm"
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Decline
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
                        <div>
                            {loadingConversations ? (
                                <div className="flex justify-center items-center py-16">
                                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-10 h-10 text-purple-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">Start messaging your friends!</p>
                                    <button
                                        onClick={() => setActiveTab('friends')}
                                        className="btn-primary"
                                    >
                                        View Friends
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {conversations.map(conversation => (
                                        <div
                                            key={conversation.chatId}
                                            className="group p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                                            onClick={() => window.location.href = `/messages/${conversation.friend.id}`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                                        <User className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                            {conversation.friend.displayName}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTime(conversation.latestMessage.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                                        {conversation.latestMessage.senderId === user.uid ? 'You: ' : ''}
                                                        {conversation.latestMessage.message}
                                                    </p>
                                                </div>
                                                <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
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
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={closeFriendModal}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedFriend.displayName}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {selectedFriend.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeFriendModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {loadingFriendDetails ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading friend's progress...</span>
                                </div>
                            ) : friendDetails ? (
                                <div className="space-y-6">
                                    {/* Progress Stats */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
                                            Learning Progress
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <BookOpen className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{friendDetails.stats.totalCourses}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <CheckCircle className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{friendDetails.stats.completedCourses}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Clock className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{friendDetails.stats.studyHours}h</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Study Hours</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Award className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{friendDetails.stats.averageCompletion}%</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                                            </div>
                                        </div>

                                        {/* Overall Completion Rate */}
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Completion</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{friendDetails.stats.averageCompletion}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${friendDetails.stats.averageCompletion}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Friends Section */}
                                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Users className="w-6 h-6 mr-2 text-green-500" />
                                            Friends ({selectedFriendsFriends.length})
                                        </h3>

                                        {loadingFriendsFriends ? (
                                            <div className="flex justify-center items-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading friends...</span>
                                            </div>
                                        ) : selectedFriendsFriends.length > 0 ? (
                                            <div className="space-y-3 max-h-80 overflow-y-auto friends-modal-scrollbar">
                                                {selectedFriendsFriends.map(friend => {
                                                    const status = getFriendshipStatus(friend.id)
                                                    return (
                                                        <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                                    <User className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{friend.displayName}</p>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{friend.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                {status === 'self' ? (
                                                                    <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-full">
                                                                        You
                                                                    </span>
                                                                ) : status === 'friends' ? (
                                                                    <button
                                                                        onClick={() => handleFollowUser(friend.id)}
                                                                        className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors"
                                                                    >
                                                                        <UserMinus className="w-4 h-4" />
                                                                        <span>Unfollow</span>
                                                                    </button>
                                                                ) : status === 'pending' ? (
                                                                    <span className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full">
                                                                        Pending
                                                                    </span>
                                                                ) : status === 'received' ? (
                                                                    <span className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                                                        Requests you
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleFollowUser(friend.id)}
                                                                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
                                                                    >
                                                                        <UserPlus className="w-4 h-4" />
                                                                        <span>Follow</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400">This user has no friends yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">Unable to load friend's data</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Please try again later.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => window.location.href = `/messages/${selectedFriend.id}`}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Send Message</span>
                                </button>
                                <button
                                    onClick={closeFriendModal}
                                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
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