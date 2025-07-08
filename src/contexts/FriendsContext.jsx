import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    getDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'

const FriendsContext = createContext()

export const useFriends = () => {
    const context = useContext(FriendsContext)
    if (!context) {
        throw new Error('useFriends must be used within a FriendsProvider')
    }
    return context
}

export const FriendsProvider = ({ children }) => {
    const { user } = useAuth()
    const [friends, setFriends] = useState([])
    const [friendRequests, setFriendRequests] = useState([])
    const [sentRequests, setSentRequests] = useState([])
    const [loading, setLoading] = useState(false)

    // Test function to check database structure
    const testDatabaseStructure = async () => {
        try {
            console.log('🧪 Testing database structure...')

            const usersRef = collection(db, 'users')
            const snapshot = await getDocs(usersRef)

            console.log('📊 Total users in database:', snapshot.size)

            snapshot.forEach((doc) => {
                const data = doc.data()
                console.log('👤 User document:', {
                    id: doc.id,
                    email: data.email,
                    displayName: data.displayName,
                    emailVerified: data.emailVerified,
                    createdAt: data.createdAt,
                    friends: data.friends?.length || 0
                })
            })

            // Check current user document
            if (user) {
                const currentUserRef = doc(db, 'users', user.uid)
                const currentUserSnap = await getDoc(currentUserRef)

                if (currentUserSnap.exists()) {
                    console.log('✅ Current user document exists:', currentUserSnap.data())
                } else {
                    console.log('❌ Current user document does NOT exist!')
                }
            }

        } catch (error) {
            console.error('❌ Error testing database structure:', error)
        }
    }

    // Search for users by email or name
    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) return []

        try {
            setLoading(true)
            console.log('🔍 Searching for users with term:', searchTerm)

            const usersRef = collection(db, 'users')

            // Get all users and filter client-side for more reliable search
            const allUsersSnapshot = await getDocs(usersRef)
            console.log('📊 Total users in database:', allUsersSnapshot.size)

            const users = []
            const searchLower = searchTerm.toLowerCase().trim()

            allUsersSnapshot.forEach((doc) => {
                const userData = doc.data()
                console.log('👤 Checking user:', { id: doc.id, email: userData.email, displayName: userData.displayName })

                // Skip current user
                if (doc.id === user?.uid) {
                    console.log('⏭️ Skipping current user')
                    return
                }

                const email = (userData.email || '').toLowerCase()
                const displayName = (userData.displayName || '').toLowerCase()

                // Search in email and displayName
                if (email.includes(searchLower) || displayName.includes(searchLower)) {
                    console.log('✅ Match found:', { email, displayName })
                    users.push({
                        id: doc.id,
                        ...userData
                    })
                }
            })

            console.log('🎯 Search results:', users.length, 'users found')

            // Sort by relevance (exact matches first, then partial matches)
            users.sort((a, b) => {
                const aEmail = (a.email || '').toLowerCase()
                const aName = (a.displayName || '').toLowerCase()
                const bEmail = (b.email || '').toLowerCase()
                const bName = (b.displayName || '').toLowerCase()

                // Exact email match gets highest priority
                if (aEmail === searchLower && bEmail !== searchLower) return -1
                if (bEmail === searchLower && aEmail !== searchLower) return 1

                // Exact name match gets second priority
                if (aName === searchLower && bName !== searchLower) return -1
                if (bName === searchLower && aName !== searchLower) return 1

                // Email starts with search term gets third priority
                if (aEmail.startsWith(searchLower) && !bEmail.startsWith(searchLower)) return -1
                if (bEmail.startsWith(searchLower) && !aEmail.startsWith(searchLower)) return 1

                // Name starts with search term gets fourth priority
                if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1
                if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1

                // Alphabetical order for the rest
                return aName.localeCompare(bName)
            })

            return users.slice(0, 10) // Limit to 10 results
        } catch (error) {
            console.error('❌ Error searching users:', error)
            throw error // Re-throw to let the UI handle the error
        } finally {
            setLoading(false)
        }
    }

    // Send friend request
    const sendFriendRequest = async (friendId) => {
        if (!user) return { success: false, error: 'Not authenticated' }

        try {
            await addDoc(collection(db, 'friendRequests'), {
                from: user.uid,
                fromName: user.displayName,
                fromEmail: user.email,
                to: friendId,
                status: 'pending',
                timestamp: serverTimestamp()
            })

            return { success: true, message: 'Friend request sent!' }
        } catch (error) {
            console.error('Error sending friend request:', error)
            return { success: false, error: 'Failed to send request' }
        }
    }

    // Accept friend request
    const acceptFriendRequest = async (requestId, friendId) => {
        if (!user) return { success: false, error: 'Not authenticated' }

        try {
            // Update the request status
            await updateDoc(doc(db, 'friendRequests', requestId), {
                status: 'accepted'
            })

            // Add to both users' friends lists
            await updateDoc(doc(db, 'users', user.uid), {
                friends: arrayUnion(friendId)
            })

            await updateDoc(doc(db, 'users', friendId), {
                friends: arrayUnion(user.uid)
            })

            return { success: true, message: 'Friend request accepted!' }
        } catch (error) {
            console.error('Error accepting friend request:', error)
            return { success: false, error: 'Failed to accept request' }
        }
    }

    // Reject friend request
    const rejectFriendRequest = async (requestId) => {
        if (!user) return { success: false, error: 'Not authenticated' }

        try {
            await updateDoc(doc(db, 'friendRequests', requestId), {
                status: 'rejected'
            })

            return { success: true, message: 'Friend request rejected' }
        } catch (error) {
            console.error('Error rejecting friend request:', error)
            return { success: false, error: 'Failed to reject request' }
        }
    }

    // Remove friend
    const removeFriend = async (friendId) => {
        if (!user) return { success: false, error: 'Not authenticated' }

        try {
            // Remove from both users' friends lists
            await updateDoc(doc(db, 'users', user.uid), {
                friends: arrayRemove(friendId)
            })

            await updateDoc(doc(db, 'users', friendId), {
                friends: arrayRemove(user.uid)
            })

            return { success: true, message: 'Friend removed' }
        } catch (error) {
            console.error('Error removing friend:', error)
            return { success: false, error: 'Failed to remove friend' }
        }
    }

    // Load friends and requests when user changes
    useEffect(() => {
        if (!user) {
            setFriends([])
            setFriendRequests([])
            setSentRequests([])
            return
        }

        // Listen for friend requests
        const requestsQuery = query(
            collection(db, 'friendRequests'),
            where('to', '==', user.uid),
            where('status', '==', 'pending')
        )

        const sentRequestsQuery = query(
            collection(db, 'friendRequests'),
            where('from', '==', user.uid),
            where('status', '==', 'pending')
        )

        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
            const requests = []
            snapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() })
            })
            setFriendRequests(requests)
        })

        const unsubscribeSent = onSnapshot(sentRequestsQuery, (snapshot) => {
            const sent = []
            snapshot.forEach((doc) => {
                sent.push({ id: doc.id, ...doc.data() })
            })
            setSentRequests(sent)
        })

        // Listen for user's friends list changes
        const userDocRef = doc(db, 'users', user.uid)
        const unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data()
                const friendIds = userData.friends || []

                if (friendIds.length > 0) {
                    // Get friends' details using proper document references
                    const friendsData = []
                    for (const friendId of friendIds) {
                        try {
                            const friendDocRef = doc(db, 'users', friendId)
                            const friendDoc = await getDoc(friendDocRef)
                            if (friendDoc.exists()) {
                                friendsData.push({ id: friendDoc.id, ...friendDoc.data() })
                            }
                        } catch (error) {
                            console.error('Error loading friend:', friendId, error)
                        }
                    }
                    setFriends(friendsData)
                } else {
                    setFriends([])
                }
            }
        })

        return () => {
            unsubscribeRequests()
            unsubscribeSent()
            unsubscribeUser()
        }
    }, [user])

    const value = {
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
    }

    return (
        <FriendsContext.Provider value={value}>
            {children}
        </FriendsContext.Provider>
    )
} 