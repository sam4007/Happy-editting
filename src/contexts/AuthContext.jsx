import React, { createContext, useContext, useState, useEffect } from 'react'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../config/firebase'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Create or update user document in Firestore
    const createUserDocument = async (user) => {
        if (!user) return

        try {
            const userRef = doc(db, 'users', user.uid)
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                // Create new user document
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'User',
                    photoURL: user.photoURL || null,
                    emailVerified: user.emailVerified,
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                    friends: [],
                    stats: {
                        totalCourses: 0,
                        completedCourses: 0,
                        totalStudyTime: 0,
                        completionRate: 0
                    }
                })
                console.log('✅ User document created in Firestore')
            } else {
                // Update existing user document with latest info
                await setDoc(userRef, {
                    displayName: user.displayName || userSnap.data().displayName,
                    photoURL: user.photoURL || userSnap.data().photoURL,
                    emailVerified: user.emailVerified,
                    lastLoginAt: serverTimestamp()
                }, { merge: true })
                console.log('✅ User document updated in Firestore')
            }
        } catch (error) {
            console.error('❌ Error creating/updating user document:', error)
        }
    }

    // Sign up with email and password
    const signup = async (email, password, displayName) => {
        try {
            setError(null)
            setLoading(true)

            const userCredential = await createUserWithEmailAndPassword(auth, email, password)

            // Update the user's display name
            if (displayName) {
                await updateProfile(userCredential.user, {
                    displayName: displayName
                })
            }

            // Create user document in Firestore
            await createUserDocument({
                ...userCredential.user,
                displayName: displayName
            })

            // Send email verification
            await sendEmailVerification(userCredential.user)

            return userCredential.user
        } catch (error) {
            setError(error.message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Login with email and password
    const login = async (email, password) => {
        try {
            setError(null)
            setLoading(true)

            const userCredential = await signInWithEmailAndPassword(auth, email, password)

            // Create or update user document in Firestore
            await createUserDocument(userCredential.user)

            return userCredential.user
        } catch (error) {
            setError(error.message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            setError(null)
            setLoading(true)

            const userCredential = await signInWithPopup(auth, googleProvider)

            // Create or update user document in Firestore
            await createUserDocument(userCredential.user)

            return userCredential.user
        } catch (error) {
            setError(error.message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Logout
    const logout = async () => {
        try {
            setError(null)
            await signOut(auth)
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    // Reset password
    const resetPassword = async (email) => {
        try {
            setError(null)
            await sendPasswordResetEmail(auth, email)
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    // Update user profile
    const updateUserProfile = async (updates) => {
        try {
            setError(null)
            await updateProfile(auth.currentUser, updates)

            // Also update Firestore document
            if (auth.currentUser) {
                await createUserDocument(auth.currentUser)
            }
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    // Save additional profile data to Firestore
    const saveProfileData = async (profileData) => {
        try {
            if (!auth.currentUser) throw new Error('No authenticated user')

            const userRef = doc(db, 'users', auth.currentUser.uid)
            await setDoc(userRef, {
                ...profileData,
                updatedAt: serverTimestamp()
            }, { merge: true })

            console.log('✅ Profile data saved to Firestore')
        } catch (error) {
            console.error('❌ Error saving profile data:', error)
            throw error
        }
    }

    // Get user profile data from Firestore
    const getUserProfileData = async (uid = null) => {
        try {
            const userId = uid || auth.currentUser?.uid
            if (!userId) throw new Error('No user ID provided')

            const userRef = doc(db, 'users', userId)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                return userSnap.data()
            } else {
                console.log('No user document found')
                return null
            }
        } catch (error) {
            console.error('❌ Error getting profile data:', error)
            throw error
        }
    }

    // Clear error
    const clearError = () => {
        setError(null)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)

            // Create/update user document when user signs in
            if (user) {
                await createUserDocument(user)
            }

            setLoading(false)
        })

        return unsubscribe
    }, [])

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        signInWithGoogle,
        logout,
        resetPassword,
        updateUserProfile,
        saveProfileData,
        getUserProfileData,
        clearError
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
} 