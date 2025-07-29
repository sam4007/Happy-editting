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
import { useParams } from 'react-router-dom'

// Wrapper component to ensure VideoPlayer remounts when ID changes
const VideoPlayerWrapper = () => {
    const { id } = useParams()
    return <VideoPlayer key={id} />
}
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
                            <Router future={{
                                v7_startTransition: true,
                                v7_relativeSplatPath: true
                            }}>
                                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                                    <Routes>
                                        {/* Authentication Route */}
                                        <Route path="/auth" element={<AuthPage />} />

                                        {/* Protected Routes */}
                                        <Route path="/*" element={
                                            <ProtectedRoute>
                                                <div className="min-h-screen">
                                                    <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                                                    <div className="flex">
                                                        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
                                                        <main className="flex-1 min-h-screen pt-14 lg:ml-64 transition-all duration-300 ease-out">
                                                            <div className="animate-fade-in">
                                                                <Routes>
                                                                    <Route path="/" element={<Dashboard />} />
                                                                    <Route path="/library" element={<Library />} />
                                                                    <Route path="/video/:id" element={<VideoPlayerWrapper />} />
                                                                    <Route path="/analytics" element={<Analytics />} />
                                                                    <Route path="/settings" element={<Settings />} />
                                                                    <Route path="/profile-settings" element={<ProfileSettings />} />
                                                                    <Route path="/account-settings" element={<AccountSettings />} />
                                                                    <Route path="/email-preferences" element={<EmailPreferences />} />
                                                                    <Route path="/friends" element={<Friends />} />
                                                                    <Route path="/messages/:friendId" element={<Messages />} />
                                                                    <Route path="*" element={<Navigate to="/" replace />} />
                                                                </Routes>
                                                            </div>
                                                        </main>
                                                    </div>
                                                </div>
                                            </ProtectedRoute>
                                        } />
                                    </Routes>
                                </div>
                            </Router>
                        </VideoProvider>
                    </FriendsProvider>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App 