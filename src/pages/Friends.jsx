import React, { useState, useEffect } from 'react'
import { useFriends } from '../contexts/FriendsContext'
import { useAuth } from '../contexts/AuthContext'
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot
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
    Mail
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

    // Load conversations when Messages tab is active
    useEffect(() => {
        if (activeTab === 'messages' && user) {
            loadConversations()
        }
    }, [activeTab, user])

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Friends</h1>

                    {/* Message */}
                    {message && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <p className="text-blue-700 dark:text-blue-300">{message}</p>
                        </div>
                    )}

                    {/* Search */}
                    <div className="mb-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </form>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Search Results</h2>
                            <div className="space-y-2">
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSendRequest(user.id)}
                                            disabled={sentRequests.some(req => req.to === user.id)}
                                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>
                                                {sentRequests.some(req => req.to === user.id) ? 'Sent' : 'Add Friend'}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'friends'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4" />
                                    <span>Friends ({friends.length})</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4" />
                                    <span>Requests ({friendRequests.length})</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('messages')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'messages'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Messages ({conversations.length})</span>
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    {activeTab === 'friends' && (
                        <div>
                            {friends.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No friends yet. Search for users to add them!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {friends.map(friend => (
                                        <div key={friend.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{friend.displayName}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{friend.email}</p>
                                                </div>
                                            </div>

                                            {/* Friend Stats */}
                                            {friend.stats && (
                                                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div className="text-center">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{friend.stats.totalCourses || 0}</p>
                                                            <p className="text-gray-500 dark:text-gray-400">Courses</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{friend.stats.completionRate || 0}%</p>
                                                            <p className="text-gray-500 dark:text-gray-400">Completion</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => window.location.href = `/messages/${friend.id}`}
                                                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>Message</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFriend(friend.id)}
                                                    className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
                                <div className="text-center py-12">
                                    <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No friend requests</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {friendRequests.map(request => (
                                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{request.fromName}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{request.fromEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id, request.from)}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>Accept</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span>Reject</span>
                                                </button>
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
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No conversations yet. Start messaging your friends!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {conversations.map(conversation => (
                                        <div
                                            key={conversation.chatId}
                                            className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                                            onClick={() => window.location.href = `/messages/${conversation.friend.id}`}
                                        >
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {conversation.friend.displayName}
                                                    </h3>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                        {formatTime(conversation.latestMessage.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                                        {conversation.latestMessage.senderId === user.uid ? 'You: ' : ''}
                                                        {conversation.latestMessage.message}
                                                    </p>
                                                </div>
                                            </div>
                                            <MessageCircle className="w-5 h-5 text-gray-400 ml-2" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Friends 