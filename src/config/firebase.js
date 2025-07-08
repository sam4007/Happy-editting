import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAnMtmePK-PTAR4T3aiJHvGZF1EwH5vLj8",
    authDomain: "course-organiser.firebaseapp.com",
    projectId: "course-organiser",
    storageBucket: "course-organiser.firebasestorage.app",
    messagingSenderId: "763145947493",
    appId: "1:763145947493:web:2fb8a204bf19e3103a398c",
    measurementId: "G-56MYM865K8"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider()

// Initialize Firestore Database
export const db = getFirestore(app)

// Ensure Firestore network is enabled
enableNetwork(db).then(() => {
    console.log('🔥 Firebase: Network enabled successfully');
}).catch((error) => {
    console.error('🔥 Firebase: Failed to enable network:', error);
});

// Initialize Firebase Storage
export const storage = getStorage(app)

// Initialize Analytics (optional)
export const analytics = getAnalytics(app)

export default app 