# 🚀 Production Setup Guide for Lumière

## 📋 Pre-Production Checklist

### 1. Environment Variables
Create a `.env.production` file with:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# YouTube API Configuration
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Application Configuration
VITE_APP_NAME=Lumière
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCIAL_FEATURES=true
```

### 2. Security Hardening
- [ ] Enable Firebase App Check
- [ ] Set up proper Firestore security rules
- [ ] Configure CORS policies
- [ ] Enable HTTPS only
- [ ] Set up rate limiting

### 3. Performance Optimization
- [ ] Enable code splitting
- [ ] Implement lazy loading
- [ ] Optimize bundle size
- [ ] Enable compression
- [ ] Set up CDN

## 🏗️ Build Configuration

### Update vite.config.js for Production
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          router: ['react-router-dom']
        }
      }
    }
  },
  server: {
    host: true,
    port: 3000
  }
})
```

## 🌐 Hosting Options

### Option 1: Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 3: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Option 4: AWS S3 + CloudFront
```bash
# Build the app
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 📊 Monitoring & Analytics

### 1. Error Tracking
- Sentry for error monitoring
- Firebase Crashlytics for mobile apps

### 2. Performance Monitoring
- Google Analytics 4
- Firebase Performance Monitoring
- Web Vitals tracking

### 3. User Analytics
- Firebase Analytics
- Hotjar for user behavior
- Google Tag Manager

## 🔒 Security Best Practices

### 1. Firebase Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Videos - users can read public, write their own
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 2. Authentication
- Enable email verification
- Set up password policies
- Implement rate limiting on auth endpoints

## 🚀 Scaling Strategies

### 1. Database Optimization
- Implement pagination
- Use Firestore indexes efficiently
- Cache frequently accessed data

### 2. CDN & Edge Computing
- Use Firebase Hosting with CDN
- Implement edge functions for API calls
- Cache static assets globally

### 3. Load Balancing
- Use Firebase Hosting (handles this automatically)
- Consider Cloud Load Balancing for custom backends

## 📱 PWA Features

### 1. Service Worker
- Offline functionality
- Background sync
- Push notifications

### 2. App Manifest
- Install prompts
- Splash screens
- App icons

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
          channelId: live
```

## 💰 Cost Optimization

### 1. Firebase Pricing
- Free tier: 50,000 reads/day, 20,000 writes/day
- Pay-as-you-go: $0.18 per 100,000 reads, $0.18 per 100,000 writes

### 2. Hosting Costs
- Firebase Hosting: Free tier available
- Vercel: Free tier available
- Netlify: Free tier available

## 🎯 Next Steps

1. **Choose hosting platform** (Firebase recommended for your stack)
2. **Set up environment variables**
3. **Configure security rules**
4. **Build and test production build**
5. **Deploy to staging environment**
6. **Test thoroughly**
7. **Deploy to production**
8. **Set up monitoring and analytics**

## 📞 Support

- Firebase Documentation: https://firebase.google.com/docs
- Vite Documentation: https://vitejs.dev/
- React Documentation: https://reactjs.org/

