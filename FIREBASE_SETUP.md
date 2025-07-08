# Firebase Authentication Setup Guide

This guide will help you set up Firebase authentication for your Happy Editing application.

## Step 1: Install Firebase Dependencies

First, install the Firebase dependency:

```bash
npm install firebase
```

## Step 2: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "happy-editing-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 3: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable the following sign-in providers:
   - **Email/Password**: Click on it and toggle "Enable" → Save
   - **Google**: Click on it, toggle "Enable", add your project support email → Save

## Step 4: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon `</>`
5. Register your app with a nickname (e.g., "Happy Editing Web")
6. Copy the Firebase configuration object

## Step 5: Configure Your Application

1. Open `src/config/firebase.js`
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-messaging-sender-id",
    appId: "your-actual-app-id"
}
```

## Step 6: Set Up OAuth Authorized Domains

1. In Firebase console, go to "Authentication" → "Settings" → "Authorized domains"
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (when you deploy)

## Step 7: Configure Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to "APIs & Services" → "Credentials"
4. Find your "Web client" OAuth 2.0 client
5. Add authorized origins:
   - `http://localhost:3000` (for development)
   - `http://localhost:3001` (backup port)
   - Your production URL

## Step 8: Test the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to `/auth` in your browser
3. Try creating a new account or signing in with Google
4. Check the Firebase console under "Authentication" → "Users" to see registered users

## Security Rules (Important!)

In your Firebase project, go to "Authentication" → "Settings" → "Security" and ensure:

1. **Email enumeration protection** is enabled
2. **Account takeover protection** is enabled (if available in your plan)

## Environment Variables (Optional)

For additional security, you can use environment variables:

1. Create a `.env.local` file in your project root
2. Add your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. Update `src/config/firebase.js`:
   ```javascript
   const firebaseConfig = {
       apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
       authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
       projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
       storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
       messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
       appId: import.meta.env.VITE_FIREBASE_APP_ID
   }
   ```

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to Firebase Console → Authentication → Settings → Authorized domains

2. **Google Sign-in not working**
   - Check Google Cloud Console OAuth settings
   - Ensure authorized origins are correctly set

3. **"Firebase: Error (auth/popup-blocked)"**
   - Browser is blocking popups
   - User needs to allow popups for your site

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure all authentication methods are properly enabled
4. Check that domains are authorized

## Next Steps

Once authentication is working:
1. Customize the login/signup forms styling
2. Add user profile management features
3. Set up Firebase Security Rules for your data
4. Consider adding more authentication providers (Facebook, Twitter, etc.)

Your Happy Editing application now has complete user authentication! 🎉 