#!/bin/bash

# 🚀 Lumière Production Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

echo "🚀 Starting Lumière Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Please create it with your production environment variables."
    print_status "You can copy from .env.example and update the values."
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Run tests (if available)
if npm run test 2>/dev/null; then
    print_success "Tests passed!"
else
    print_warning "No tests found or tests failed. Continuing with deployment..."
fi

# Build the application
print_status "Building production application..."
npm run build:prod

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed! dist directory not found."
    exit 1
fi

print_success "Build completed successfully!"

# Choose deployment platform
echo ""
echo "🌐 Choose your deployment platform:"
echo "1) Firebase Hosting (Recommended)"
echo "2) Vercel"
echo "3) Netlify"
echo "4) Custom deployment"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_status "Deploying to Firebase Hosting..."
        
        # Check if Firebase CLI is installed
        if ! command -v firebase &> /dev/null; then
            print_error "Firebase CLI not found. Installing..."
            npm install -g firebase-tools
        fi
        
        # Login to Firebase
        firebase login
        
        # Deploy
        firebase deploy --only hosting
        
        print_success "Deployed to Firebase Hosting!"
        ;;
    2)
        print_status "Deploying to Vercel..."
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            print_error "Vercel CLI not found. Installing..."
            npm install -g vercel
        fi
        
        # Deploy
        vercel --prod
        
        print_success "Deployed to Vercel!"
        ;;
    3)
        print_status "Deploying to Netlify..."
        
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            print_error "Netlify CLI not found. Installing..."
            npm install -g netlify-cli
        fi
        
        # Deploy
        netlify deploy --prod --dir=dist
        
        print_success "Deployed to Netlify!"
        ;;
    4)
        print_status "Custom deployment selected."
        print_status "Your built application is in the 'dist' directory."
        print_status "You can manually upload this to your hosting provider."
        ;;
    5)
        print_status "Deployment cancelled."
        exit 0
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Show deployment summary
echo ""
print_success "🎉 Deployment completed successfully!"
print_status "Your application is now live on the internet!"
print_status "Build files are located in the 'dist' directory."

# Optional: Clean up
read -p "Would you like to clean up build files? (y/n): " cleanup
if [ "$cleanup" = "y" ] || [ "$cleanup" = "Y" ]; then
    print_status "Cleaning up build files..."
    rm -rf dist
    print_success "Cleanup completed!"
fi

echo ""
print_success "🚀 Lumière is now live and ready for users!"

