@echo off
chcp 65001 >nul
echo 🚀 Starting Lumière Production Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if .env.production exists
if not exist ".env.production" (
    echo [WARNING] .env.production not found. Please create it with your production environment variables.
    echo You can copy from .env.example and update the values.
    echo.
)

REM Install dependencies
echo [INFO] Installing dependencies...
call npm ci --only=production

REM Run tests (if available)
echo [INFO] Running tests...
call npm run test 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Tests passed!
) else (
    echo [WARNING] No tests found or tests failed. Continuing with deployment...
)

REM Build the application
echo [INFO] Building production application...
call npm run build:prod

REM Check if build was successful
if not exist "dist" (
    echo [ERROR] Build failed! dist directory not found.
    pause
    exit /b 1
)

echo [SUCCESS] Build completed successfully!

REM Choose deployment platform
echo.
echo 🌐 Choose your deployment platform:
echo 1) Firebase Hosting (Recommended)
echo 2) Vercel
echo 3) Netlify
echo 4) Custom deployment
echo 5) Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo [INFO] Deploying to Firebase Hosting...
    
    REM Check if Firebase CLI is installed
    firebase --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Firebase CLI not found. Installing...
        call npm install -g firebase-tools
    )
    
    REM Login to Firebase
    firebase login
    
    REM Deploy
    firebase deploy --only hosting
    
    echo [SUCCESS] Deployed to Firebase Hosting!
) else if "%choice%"=="2" (
    echo [INFO] Deploying to Vercel...
    
    REM Check if Vercel CLI is installed
    vercel --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Vercel CLI not found. Installing...
        call npm install -g vercel
    )
    
    REM Deploy
    vercel --prod
    
    echo [SUCCESS] Deployed to Vercel!
) else if "%choice%"=="3" (
    echo [INFO] Deploying to Netlify...
    
    REM Check if Netlify CLI is installed
    netlify --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Netlify CLI not found. Installing...
        call npm install -g netlify-cli
    )
    
    REM Deploy
    netlify deploy --prod --dir=dist
    
    echo [SUCCESS] Deployed to Netlify!
) else if "%choice%"=="4" (
    echo [INFO] Custom deployment selected.
    echo Your built application is in the 'dist' directory.
    echo You can manually upload this to your hosting provider.
) else if "%choice%"=="5" (
    echo [INFO] Deployment cancelled.
    pause
    exit /b 0
) else (
    echo [ERROR] Invalid choice. Exiting.
    pause
    exit /b 1
)

REM Show deployment summary
echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo [INFO] Your application is now live on the internet!
echo [INFO] Build files are located in the 'dist' directory.

REM Optional: Clean up
set /p cleanup="Would you like to clean up build files? (y/n): "
if /i "%cleanup%"=="y" (
    echo [INFO] Cleaning up build files...
    rmdir /s /q dist
    echo [SUCCESS] Cleanup completed!
)

echo.
echo [SUCCESS] 🚀 Lumière is now live and ready for users!
pause

