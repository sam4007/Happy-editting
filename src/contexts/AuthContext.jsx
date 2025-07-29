import React, { createContext, useContext, useState, useEffect } from 'react'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
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

    // Create or update user document in Firestore with retry logic
    const createUserDocument = async (user) => {
        if (!user) return

        const maxRetries = 2
        let retryCount = 0

        const attemptCreate = async () => {
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
                if ((error.code === 'resource-exhausted' || error.code === 'unavailable') && retryCount < maxRetries) {
                    retryCount++
                    const delay = 1000 * Math.pow(2, retryCount) // Exponential backoff
                    console.log(`🔄 Retrying user document creation in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
                    setTimeout(attemptCreate, delay)
                } else {
                    console.error('❌ Error creating/updating user document (giving up):', error)
                    // Don't throw the error to prevent blocking authentication
                }
            }
        }

        await attemptCreate()
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
            setError(error.message)
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
                throw new Error('User document not found')
            }
        } catch (error) {
            console.error('❌ Error getting user profile data:', error)
            setError(error.message)
            throw error
        }
    }

    // Update user password
    const updateUserPassword = async (currentPassword, newPassword) => {
        try {
            setError(null)

            if (!auth.currentUser) throw new Error('No authenticated user')

            // Re-authenticate the user first
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            )

            await reauthenticateWithCredential(auth.currentUser, credential)

            // Update password
            await updatePassword(auth.currentUser, newPassword)

            console.log('✅ Password updated successfully')
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    // Send email verification
    const sendVerificationEmail = async () => {
        try {
            setError(null)

            if (!auth.currentUser) throw new Error('No authenticated user')

            await sendEmailVerification(auth.currentUser)

            console.log('✅ Verification email sent')
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    // Delete user account
    const deleteAccount = async (password) => {
        try {
            setError(null)

            if (!auth.currentUser) throw new Error('No authenticated user')

            // Re-authenticate the user before deleting account
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                password
            )

            await reauthenticateWithCredential(auth.currentUser, credential)

            // Delete user document from Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid)
            await deleteDoc(userRef)

            // Delete user authentication account
            await deleteUser(auth.currentUser)

            console.log('✅ Account deleted successfully')
        } catch (error) {
            setError(error.message)
            throw error
        }
    }

    // Clear error
    const clearError = () => {
        setError(null)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                setUser(user)

                // Create/update user document when user signs in (non-blocking)
                if (user) {
                    // Don't await this to prevent blocking the loading state
                    createUserDocument(user).catch(error => {
                        console.warn('⚠️ Non-critical: Could not create/update user document:', error)
                    })
                }
            } catch (error) {
                console.error('❌ Error in auth state change:', error)
            } finally {
                // Always set loading to false, regardless of Firestore operations
                setLoading(false)
            }
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
        updateUserPassword,
        sendVerificationEmail,
        deleteAccount,
        clearError
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
} 