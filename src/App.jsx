import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { VideoProvider } from './contexts/VideoContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { FriendsProvider } from './contexts/FriendsContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import VideoPlayer from './pages/VideoPlayer'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ProfileSettings from './pages/ProfileSettings'
import AccountSettings from './pages/AccountSettings'
import EmailPreferences from './pages/EmailPreferences'
import Friends from './pages/Friends'
import Messages from './pages/Messages'

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <FriendsProvider>
                        <VideoProvider>
                            <Router>
                                <Routes>
                                    {/* Authentication Route */}
                                    <Route path="/auth" element={<AuthPage />} />

                                    {/* Protected Routes */}
                                    <Route path="/*" element={
                                        <ProtectedRoute>
                                            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                                                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                                                <div className="flex">
                                                    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
                                                    <main className="flex-1 min-h-screen pt-16">
                                                        <Routes>
                                                            <Route path="/" element={<Dashboard />} />
                                                            <Route path="/library" element={<Library />} />
                                                            <Route path="/video/:id" element={<VideoPlayer />} />
                                                            <Route path="/analytics" element={<Analytics />} />
                                                            <Route path="/settings" element={<Settings />} />
                                                            <Route path="/profile-settings" element={<ProfileSettings />} />
                                                            <Route path="/account-settings" element={<AccountSettings />} />
                                                            <Route path="/email-preferences" element={<EmailPreferences />} />
                                                            <Route path="/friends" element={<Friends />} />
                                                            <Route path="/messages/:friendId" element={<Messages />} />
                                                            {/* Redirect any unknown routes to dashboard */}
                                                            <Route path="*" element={<Navigate to="/" replace />} />
                                                        </Routes>
                                                    </main>
                                                </div>
                                            </div>
                                        </ProtectedRoute>
                                    } />
                                </Routes>
                            </Router>
                        </VideoProvider>
                    </FriendsProvider>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App 