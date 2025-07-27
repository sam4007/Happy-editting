import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../config/firebase'
import { doc, updateDoc } from 'firebase/firestore'

const VideoContext = createContext()

export const useVideo = () => {
    const context = useContext(VideoContext)
    if (!context) {
        throw new Error('useVideo must be used within a VideoProvider')
    }
    return context
}

export const VideoProvider = ({ children }) => {
    const { user } = useAuth()
    const [videos, setVideos] = useState([])
    const [categories, setCategories] = useState(['All', 'Programming', 'Mathematics', 'Science', 'Language', 'Business', 'Video Editing'])
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [favorites, setFavorites] = useState([])
    const [watchHistory, setWatchHistory] = useState([])
    const [notes, setNotes] = useState({})
    const [bookmarks, setBookmarks] = useState({})
    const [dailyActivity, setDailyActivity] = useState({})
    const [dailyCompletedVideos, setDailyCompletedVideos] = useState({})
    const [recentActivities, setRecentActivities] = useState([])
    const [isInitialized, setIsInitialized] = useState(false)

    // Calculate user stats from current video data
    const calculateUserStats = (videoList = videos) => {
        const playlists = {}

        // Group videos by playlist/course
        videoList.forEach(video => {
            const playlistKey = `${video.source || 'manual'}_${video.instructor}_${video.category}`
            if (!playlists[playlistKey]) {
                playlists[playlistKey] = {
                    videos: [],
                    completed: false
                }
            }
            playlists[playlistKey].videos.push(video)
        })

        // Calculate course completion
        let completedCourses = 0
        Object.values(playlists).forEach(playlist => {
            const totalVideos = playlist.videos.length
            const completedVideos = playlist.videos.filter(v => v.completed).length
            if (completedVideos === totalVideos && totalVideos > 0) {
                completedCourses++
            }
        })

        // Calculate study hours (completed videos duration)
        let studyMinutes = 0
        videoList.forEach(video => {
            if (video.completed && video.duration) {
                const parts = video.duration.split(':').map(Number)
                if (parts.length === 2) {
                    studyMinutes += parts[0] + (parts[1] / 60)
                } else if (parts.length === 3) {
                    studyMinutes += (parts[0] * 60) + parts[1] + (parts[2] / 60)
                }
            }
        })

        const studyHours = Math.round(studyMinutes / 60 * 10) / 10 // Round to 1 decimal

        return {
            totalCourses: Object.keys(playlists).length,
            completedCourses,
            studyHours,
            completionRate: Object.keys(playlists).length > 0 ? Math.round((completedCourses / Object.keys(playlists).length) * 100) : 0
        }
    }

    // Update user stats in Firestore
    const updateUserStatsInFirestore = async (videoList = videos) => {
        if (!user) {
            console.log('📊 VideoContext: No user logged in, skipping stats update')
            return
        }

        try {
            const stats = calculateUserStats(videoList)
            console.log('📊 VideoContext: Calculated stats:', stats)
            console.log('📊 VideoContext: Video count for calculation:', videoList.length)

            const userRef = doc(db, 'users', user.uid)
            await updateDoc(userRef, {
                stats: {
                    ...stats,
                    completionRate: stats.totalCourses > 0 ? Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0
                }
            })

            console.log('✅ VideoContext: User stats updated successfully in Firestore')
        } catch (error) {
            console.error('❌ VideoContext: Could not update user stats:', error)
        }
    }

    // Debug function to manually test stats
    const debugStats = () => {
        console.log('🔍 Debug Stats - Current videos:', videos.length)
        console.log('🔍 Debug Stats - Current user:', user?.uid)
        const stats = calculateUserStats(videos)
        console.log('🔍 Debug Stats - Calculated:', stats)
        updateUserStatsInFirestore(videos)
    }

    // Generate user-specific localStorage keys
    const getStorageKey = (key) => {
        return user ? `${key}_${user.uid}` : `${key}_guest`
    }

    // Clear all user data
    const clearUserData = () => {
        setVideos([])
        setFavorites([])
        setWatchHistory([])
        setNotes({})
        setBookmarks({})
        setDailyActivity({})
        setDailyCompletedVideos({})
        setCategories(['All', 'Programming', 'Mathematics', 'Science', 'Language', 'Business', 'Video Editing'])
        setSelectedCategory('All')
        setIsInitialized(false)
    }

    // Load user-specific data when user changes
    useEffect(() => {
        if (user === null) {
            // User is logging out, clear data
            clearUserData()
            setIsInitialized(true)
            return
        }

        if (user === undefined) {
            // Auth is still loading
            return
        }

        // User is logged in, load their specific data
        loadUserData()
    }, [user])

    const loadUserData = () => {
        const savedVideos = localStorage.getItem(getStorageKey('videos'))
        const savedCategories = localStorage.getItem(getStorageKey('categories'))
        const savedFavorites = localStorage.getItem(getStorageKey('favorites'))
        const savedWatchHistory = localStorage.getItem(getStorageKey('watchHistory'))
        const savedNotes = localStorage.getItem(getStorageKey('notes'))
        const savedBookmarks = localStorage.getItem(getStorageKey('bookmarks'))
        const savedDailyActivity = localStorage.getItem(getStorageKey('dailyActivity'))
        const savedDailyCompletedVideos = localStorage.getItem(getStorageKey('dailyCompletedVideos'))
        const savedRecentActivities = localStorage.getItem(getStorageKey('recentActivities'))

        if (savedVideos) {
            console.log(`📺 Loading videos for user ${user?.uid}:`, JSON.parse(savedVideos).length, 'videos')
            const loadedVideos = JSON.parse(savedVideos)

            // Fix YouTube and Vimeo URLs for existing videos
            const fixedVideos = loadedVideos.map(video => {
                if (video.url && typeof video.url === 'string') {
                    try {
                        const urlObj = new URL(video.url)

                        // Handle YouTube URLs
                        if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(urlObj.hostname)) {
                            let videoId = null

                            if (urlObj.hostname === 'youtu.be') {
                                videoId = urlObj.pathname.slice(1)
                            } else if (urlObj.searchParams.has('v')) {
                                videoId = urlObj.searchParams.get('v')
                            } else if (urlObj.pathname.includes('/embed/')) {
                                const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/)
                                if (embedMatch) {
                                    videoId = embedMatch[1]
                                }
                            }

                            if (videoId) {
                                videoId = videoId.split('&')[0].split('?')[0]
                                return {
                                    ...video,
                                    url: `https://www.youtube.com/embed/${videoId}`,
                                    videoId: videoId,
                                    source: 'youtube'
                                }
                            }
                        }

                        // Handle Vimeo URLs
                        else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(urlObj.hostname)) {
                            let videoId = null
                            let hashParam = null

                            if (urlObj.hostname === 'player.vimeo.com') {
                                const embedMatch = urlObj.pathname.match(/\/video\/(\d+)/)
                                if (embedMatch) {
                                    videoId = embedMatch[1]
                                }
                            } else {
                                const vimeoMatch = urlObj.pathname.match(/\/(\d+)/)
                                if (vimeoMatch) {
                                    videoId = vimeoMatch[1]
                                }
                            }

                            // Extract hash parameter if present (for private videos)
                            hashParam = urlObj.searchParams.get('h') || video.url.match(/\?h=([^&]+)/)?.[1]

                            if (videoId) {
                                const hashQuery = hashParam ? `?h=${hashParam}` : ''
                                return {
                                    ...video,
                                    url: `https://player.vimeo.com/video/${videoId}${hashQuery}`,
                                    videoId: videoId,
                                    source: 'vimeo'
                                }
                            }
                        }

                        // Return original video if no changes needed
                        return video

                    } catch (error) {
                        console.warn('Could not parse video URL:', video.url, error)
                        return video
                    }
                }
                return video
            })

            setVideos(fixedVideos)

            // Save fixed videos back to localStorage
            const hasChanges = fixedVideos.some((video, index) =>
                video.url !== loadedVideos[index]?.url
            )
            if (hasChanges) {
                console.log('🔧 Fixed video URLs for existing videos (YouTube & Vimeo)')
                localStorage.setItem(getStorageKey('videos'), JSON.stringify(fixedVideos))
            }
        } else {
            setVideos([])
        }

        if (savedCategories) {
            console.log(`🏷️ Loading categories for user ${user?.uid}:`, JSON.parse(savedCategories))
            setCategories(JSON.parse(savedCategories))
        } else {
            setCategories(['All', 'Programming', 'Mathematics', 'Science', 'Language', 'Business', 'Video Editing'])
        }

        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites))
        } else {
            setFavorites([])
        }

        if (savedWatchHistory) {
            setWatchHistory(JSON.parse(savedWatchHistory))
        } else {
            setWatchHistory([])
        }

        if (savedNotes) {
            setNotes(JSON.parse(savedNotes))
        } else {
            setNotes({})
        }

        if (savedBookmarks) {
            setBookmarks(JSON.parse(savedBookmarks))
        } else {
            setBookmarks({})
        }

        if (savedDailyActivity) {
            setDailyActivity(JSON.parse(savedDailyActivity))
        } else {
            setDailyActivity({})
        }

        if (savedDailyCompletedVideos) {
            setDailyCompletedVideos(JSON.parse(savedDailyCompletedVideos))
        } else {
            setDailyCompletedVideos({})
        }

        if (savedRecentActivities) {
            const loadedActivities = JSON.parse(savedRecentActivities)
            const cleanedActivities = cleanupDuplicateActivities(loadedActivities)
            console.log(`🧹 Cleaned up recent activities: ${loadedActivities.length} → ${cleanedActivities.length}`)
            setRecentActivities(cleanedActivities)
        } else {
            setRecentActivities([])
        }

        // Set initialized to true after loading
        setIsInitialized(true)
        console.log(`✅ VideoContext initialized for user ${user?.uid || 'guest'}`)

        // Update user stats in Firestore after loading data
        if (savedVideos && user) {
            const loadedVideos = JSON.parse(savedVideos)
            updateUserStatsInFirestore(loadedVideos)
        }
    }

    // Save data to localStorage whenever state changes (but only after initialization and when user is available)
    useEffect(() => {
        if (!isInitialized || !user) return

        console.log(`💾 Saving videos for user ${user.uid}:`, videos.length, 'videos')
        localStorage.setItem(getStorageKey('videos'), JSON.stringify(videos))
    }, [videos, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('favorites'), JSON.stringify(favorites))
    }, [favorites, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('watchHistory'), JSON.stringify(watchHistory))
    }, [watchHistory, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('notes'), JSON.stringify(notes))
    }, [notes, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('bookmarks'), JSON.stringify(bookmarks))
    }, [bookmarks, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('dailyActivity'), JSON.stringify(dailyActivity))
    }, [dailyActivity, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('dailyCompletedVideos'), JSON.stringify(dailyCompletedVideos))
    }, [dailyCompletedVideos, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        localStorage.setItem(getStorageKey('recentActivities'), JSON.stringify(recentActivities))
    }, [recentActivities, isInitialized, user])

    useEffect(() => {
        if (!isInitialized || !user) return
        console.log(`💾 Saving categories for user ${user.uid}:`, categories)
        localStorage.setItem(getStorageKey('categories'), JSON.stringify(categories))
    }, [categories, isInitialized, user])

    const addVideo = (video) => {
        const newVideo = {
            ...video,
            id: Date.now() + Math.random(), // Ensure unique IDs for bulk imports
            progress: 0,
            completed: false,
            uploadDate: new Date().toISOString().split('T')[0],
            thumbnail: video.thumbnail || `https://via.placeholder.com/320x180/${video.category === 'Programming' ? '3b82f6' : video.category === 'Mathematics' ? '10b981' : video.category === 'Science' ? '8b5cf6' : video.category === 'Language' ? 'f59e0b' : video.category === 'Video Editing' ? '8b5cf6' : 'ef4444'}/ffffff?text=${encodeURIComponent(video.title?.substring(0, 20) || 'Video')}`
        }
        setVideos(prev => {
            const updatedVideos = [...prev, newVideo]
            // Save to localStorage
            localStorage.setItem(getStorageKey('videos'), JSON.stringify(updatedVideos))
            // Update user stats in Firestore
            updateUserStatsInFirestore(updatedVideos)
            return updatedVideos
        })
    }

    const addBulkVideos = (videoList) => {
        console.log('📥 Adding bulk videos:', videoList.length, 'videos')

        const newVideos = videoList.map((video, index) => ({
            ...video,
            id: Date.now() + index,
            progress: 0,
            completed: false,
            uploadDate: new Date().toISOString().split('T')[0],
            thumbnail: video.thumbnail || `https://via.placeholder.com/320x180/8b5cf6/ffffff?text=${encodeURIComponent(video.title?.substring(0, 20) || 'Video')}`
        }))

        setVideos(prev => {
            const updatedVideos = [...prev, ...newVideos]
            console.log('✅ Total videos after bulk add:', updatedVideos.length, 'localStorage will auto-save')

            // Check if this is the Happy Editting course import
            const isHappyEdittingCourse = videoList.some(video =>
                video.instructor === 'Happy Editting' &&
                video.category === 'Video Editing'
            )

            if (isHappyEdittingCourse) {
                localStorage.setItem(getStorageKey('happyEdittingCourseImported'), 'true')
                console.log('🎬 Happy Editting course import flag set')
            }

            // Track bulk import activity
            if (videoList.length > 0) {
                const firstVideo = videoList[0]
                const playlistName = firstVideo.playlistTitle || `${firstVideo.instructor} - ${firstVideo.category}`
                addRecentActivity('playlist_imported', {
                    playlistName,
                    videoCount: videoList.length,
                    instructor: firstVideo.instructor,
                    category: firstVideo.category,
                    source: firstVideo.source || 'manual'
                })
            }

            // Update user stats in Firestore
            updateUserStatsInFirestore(updatedVideos)

            return updatedVideos
        })
    }

    // Enhanced activity tracking function
    const trackDailyActivity = (activityType = 'interaction') => {
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        setDailyActivity(prev => {
            const currentCount = prev[today] || 0
            // Cap daily activity at reasonable number (15 per day) to prevent inflation
            const newCount = Math.min(currentCount + 1, 15)
            console.log(`📊 Daily activity tracked: ${activityType} - Count: ${newCount}`)
            return {
                ...prev,
                [today]: newCount
            }
        })
    }

    // Track recent activities with detailed information
    const addRecentActivity = (type, data) => {
        const activity = {
            id: Date.now() + Math.random(), // Ensure unique ID
            type,
            timestamp: new Date().toISOString(),
            ...data
        }

        setRecentActivities(prev => {
            // For video-related activities, remove ALL previous activities for the same video
            // This ensures each video appears only once with its most recent activity
            let filteredActivities = prev
            
            if (data.videoId) {
                // Remove all previous activities for this video
                filteredActivities = prev.filter(existingActivity => 
                    existingActivity.videoId !== data.videoId
                )
                console.log(`🧹 Removed previous activities for video: ${data.videoTitle || data.videoId}`)
            }

            // Add the new activity at the beginning
            const newActivities = [activity, ...filteredActivities].slice(0, 50) // Keep last 50 activities
            console.log(`✅ Added new activity: ${type} for ${data.videoTitle || data.videoId}`)
            return newActivities
        })

        // Also track in daily activity
        trackDailyActivity(type)
    }

    // Clean up duplicate activities from existing data
    const cleanupDuplicateActivities = (activities) => {
        const videoActivities = new Map() // videoId -> most recent activity
        const nonVideoActivities = [] // activities without videoId

        for (const activity of activities) {
            if (activity.videoId) {
                // For video activities, keep only the most recent one per video
                const existing = videoActivities.get(activity.videoId)
                if (!existing || new Date(activity.timestamp) > new Date(existing.timestamp)) {
                    videoActivities.set(activity.videoId, activity)
                }
            } else {
                // For non-video activities (like playlist imports), keep them all
                nonVideoActivities.push(activity)
            }
        }

        // Combine video activities (one per video) with non-video activities
        const cleanedActivities = [
            ...Array.from(videoActivities.values()),
            ...nonVideoActivities
        ]

        // Sort by timestamp (newest first)
        return cleanedActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }

    const trackCompletedVideo = (videoId) => {
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        setDailyCompletedVideos(prev => {
            const currentVideos = prev[today] || []
            // Only add if video isn't already in today's completed list
            if (!currentVideos.includes(videoId)) {
                const newVideos = [...currentVideos, videoId]
                console.log(`✅ Video completed today: ${videoId} - Total: ${newVideos.length}`)
                return {
                    ...prev,
                    [today]: newVideos
                }
            }
            return prev
        })
    }

    const updateVideo = (id, updates) => {
        setVideos(prev => {
            const oldVideo = prev.find(video => video.id === id)
            const updatedVideos = prev.map(video =>
                video.id === id ? { ...video, ...updates } : video
            )

            console.log(`📹 Video updated: ${id}`, updates)

            // Track completed video if it's newly completed
            if (updates.completed && !oldVideo?.completed) {
                trackCompletedVideo(id)
                // Add to recent activities
                addRecentActivity('video_completed', {
                    videoId: id,
                    videoTitle: oldVideo.title,
                    instructor: oldVideo.instructor,
                    category: oldVideo.category,
                    duration: oldVideo.duration
                })
            }

            // Track significant progress updates (but not completion as it's tracked above)
            if (updates.progress && !updates.completed) {
                const oldProgress = oldVideo?.progress || 0
                const newProgress = updates.progress

                // Track every 25% progress milestone
                const oldMilestone = Math.floor(oldProgress / 25)
                const newMilestone = Math.floor(newProgress / 25)

                if (newMilestone > oldMilestone && newMilestone > 0) {
                    addRecentActivity('video_progress', {
                        videoId: id,
                        videoTitle: oldVideo.title,
                        instructor: oldVideo.instructor,
                        category: oldVideo.category,
                        progress: newProgress,
                        milestone: newMilestone * 25
                    })
                }
            }

            // Update user stats in Firestore
            updateUserStatsInFirestore(updatedVideos)

            return updatedVideos
        })
    }

    const deleteVideo = (id) => {
        setVideos(prev => {
            const updatedVideos = prev.filter(video => video.id !== id)
            // Update user stats in Firestore
            updateUserStatsInFirestore(updatedVideos)
            return updatedVideos
        })
    }

    const toggleFavorite = (videoId) => {
        console.log('🌟 Toggle favorite for video:', videoId)
        const video = videos.find(v => v.id === videoId)

        setFavorites(prev => {
            const wasAlreadyFavorite = prev.includes(videoId)
            const newFavorites = wasAlreadyFavorite
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]

            // Track activity when adding to favorites
            if (!wasAlreadyFavorite && video) {
                addRecentActivity('favorite_added', {
                    videoId,
                    videoTitle: video.title,
                    instructor: video.instructor,
                    category: video.category
                })
            } else if (wasAlreadyFavorite && video) {
                addRecentActivity('favorite_removed', {
                    videoId,
                    videoTitle: video.title,
                    instructor: video.instructor,
                    category: video.category
                })
            }

            console.log('🌟 New favorites:', newFavorites)
            return newFavorites
        })
    }

    const addToWatchHistory = (videoId) => {
        const video = videos.find(v => v.id === videoId)

        setWatchHistory(prev => {
            const filtered = prev.filter(id => id !== videoId)
            const newHistory = [videoId, ...filtered].slice(0, 20) // Keep last 20 watched videos

            // Only track activity if this video wasn't already in recent history
            const wasRecentlyWatched = prev.slice(0, 3).includes(videoId) // Check last 3 videos

            if (!wasRecentlyWatched && video) {
                addRecentActivity('video_watched', {
                    videoId,
                    videoTitle: video.title,
                    instructor: video.instructor,
                    category: video.category,
                    duration: video.duration
                })
            }

            return newHistory
        })
    }

    const addNote = (videoId, timestamp, note) => {
        const video = videos.find(v => v.id === videoId)

        setNotes(prev => {
            const newNotes = {
                ...prev,
                [videoId]: [
                    ...(prev[videoId] || []),
                    { id: Date.now(), timestamp, note, createdAt: new Date().toISOString() }
                ]
            }

            // Track note-taking as learning engagement
            if (video) {
                addRecentActivity('note_added', {
                    videoId,
                    videoTitle: video.title,
                    instructor: video.instructor,
                    category: video.category,
                    notePreview: note.substring(0, 50) + (note.length > 50 ? '...' : ''),
                    timestamp
                })
            }

            return newNotes
        })
    }

    const addBookmark = (videoId, timestamp, title) => {
        console.log('📌 Adding bookmark for video:', videoId, 'title:', title)
        const video = videos.find(v => v.id === videoId)

        setBookmarks(prev => {
            const newBookmarks = {
                ...prev,
                [videoId]: [
                    ...(prev[videoId] || []),
                    { id: Date.now(), timestamp, title, createdAt: new Date().toISOString() }
                ]
            }

            // Track bookmarking as learning engagement
            if (video) {
                addRecentActivity('bookmark_added', {
                    videoId,
                    videoTitle: video.title,
                    instructor: video.instructor,
                    category: video.category,
                    bookmarkTitle: title,
                    timestamp
                })
            }

            console.log('📌 New bookmarks:', newBookmarks)
            return newBookmarks
        })
    }

    const updateNote = (videoId, noteId, updates) => {
        console.log('📝 Updating note for video:', videoId, 'note ID:', noteId, 'updates:', updates)
        setNotes(prev => {
            const newNotes = {
                ...prev,
                [videoId]: prev[videoId]?.map(note =>
                    note.id === noteId
                        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
                        : note
                ) || []
            }
            console.log('📝 New notes:', newNotes)
            return newNotes
        })
    }

    const deleteNote = (videoId, noteId) => {
        console.log('🗑️ Deleting note for video:', videoId, 'note ID:', noteId)
        setNotes(prev => {
            const newNotes = {
                ...prev,
                [videoId]: prev[videoId]?.filter(note => note.id !== noteId) || []
            }
            console.log('🗑️ New notes:', newNotes)
            return newNotes
        })
    }

    // Category Management Functions
    const addCategory = (categoryName) => {
        console.log('🏷️ Adding new category:', categoryName)
        const trimmedName = categoryName.trim()
        if (trimmedName && !categories.includes(trimmedName)) {
            setCategories(prev => [...prev, trimmedName])
            console.log('✅ Category added successfully')
            return true
        }
        return false
    }

    const editCategory = (oldName, newName) => {
        console.log('🏷️ Editing category:', oldName, 'to:', newName)
        const trimmedNewName = newName.trim()
        if (trimmedNewName && oldName !== 'All' && !categories.includes(trimmedNewName)) {
            setCategories(prev => prev.map(cat => cat === oldName ? trimmedNewName : cat))

            // Update all videos with the old category name
            setVideos(prev => prev.map(video =>
                video.category === oldName ? { ...video, category: trimmedNewName } : video
            ))

            console.log('✅ Category updated successfully')
            return true
        }
        return false
    }

    const deleteCategory = (categoryName) => {
        console.log('🗑️ Deleting category:', categoryName)
        if (categoryName === 'All') {
            console.log('❌ Cannot delete "All" category')
            return false
        }

        setCategories(prev => prev.filter(cat => cat !== categoryName))

        // Move videos in deleted category to "Programming" (default category)
        setVideos(prev => prev.map(video =>
            video.category === categoryName ? { ...video, category: 'Programming' } : video
        ))

        // Reset selected category if it was deleted
        if (selectedCategory === categoryName) {
            setSelectedCategory('All')
        }

        console.log('✅ Category deleted successfully')
        return true
    }

    // YouTube Playlist Import Function
    const importYouTubePlaylist = (playlistData) => {
        console.log('🎬 Importing YouTube playlist:', playlistData.playlistTitle)

        // Add category if it doesn't exist
        if (!categories.includes(playlistData.category)) {
            addCategory(playlistData.category)
        }

        // Add all videos from the playlist
        addBulkVideos(playlistData.videos)

        console.log('✅ YouTube playlist imported successfully')
        return true
    }

    // Helper function to get playlist information
    const getPlaylistInfo = () => {
        const playlists = {}

        videos.forEach(video => {
            // Group videos by playlist identifier (combination of source, instructor, and category)
            const playlistKey = `${video.source || 'manual'}_${video.instructor}_${video.category}`

            if (!playlists[playlistKey]) {
                playlists[playlistKey] = {
                    id: playlistKey,
                    title: video.playlistTitle || `${video.instructor} - ${video.category}`,
                    instructor: video.instructor,
                    category: video.category,
                    source: video.source || 'manual',
                    originalUrl: video.originalUrl || '',
                    importDate: video.importDate || video.dateAdded || new Date().toISOString(),
                    videos: [],
                    totalVideos: 0,
                    completedVideos: 0,
                    totalDuration: 0,
                    playlistId: video.playlistId || null,
                    importedBy: video.importedBy || 'manual'
                }
            }

            playlists[playlistKey].videos.push(video)
            playlists[playlistKey].totalVideos++

            if (video.completed) {
                playlists[playlistKey].completedVideos++
            }

            // Calculate duration in minutes
            if (video.duration) {
                const parts = video.duration.split(':').map(Number)
                let minutes = 0
                if (parts.length === 2) {
                    minutes = parts[0] + (parts[1] / 60)
                } else if (parts.length === 3) {
                    minutes = (parts[0] * 60) + parts[1] + (parts[2] / 60)
                }
                playlists[playlistKey].totalDuration += minutes
            }
        })

        return Object.values(playlists)
    }

    // Delete entire playlist function
    const deletePlaylist = (playlistId) => {
        console.log('🗑️ Deleting playlist:', playlistId)

        // Find videos to delete
        const videosToDelete = videos.filter(video => {
            const videoPlaylistKey = `${video.source || 'manual'}_${video.instructor}_${video.category}`
            return videoPlaylistKey === playlistId
        })

        if (videosToDelete.length === 0) {
            console.log('❌ No videos found for playlist:', playlistId)
            return false
        }

        console.log(`🗑️ Found ${videosToDelete.length} videos to delete from playlist`)

        // Remove videos from main videos array
        setVideos(prev => {
            const updatedVideos = prev.filter(video => {
                const videoPlaylistKey = `${video.source || 'manual'}_${video.instructor}_${video.category}`
                return videoPlaylistKey !== playlistId
            })
            console.log(`✅ Playlist deleted. Remaining videos: ${updatedVideos.length}`)

            // Update user stats in Firestore
            updateUserStatsInFirestore(updatedVideos)

            return updatedVideos
        })

        // Clean up related data (notes, bookmarks, favorites, watch history)
        const videoIdsToDelete = videosToDelete.map(video => video.id)

        // Remove from favorites
        setFavorites(prev => prev.filter(id => !videoIdsToDelete.includes(id)))

        // Remove from watch history
        setWatchHistory(prev => prev.filter(id => !videoIdsToDelete.includes(id)))

        // Remove notes and bookmarks
        setNotes(prev => {
            const newNotes = { ...prev }
            videoIdsToDelete.forEach(id => delete newNotes[id])
            return newNotes
        })

        setBookmarks(prev => {
            const newBookmarks = { ...prev }
            videoIdsToDelete.forEach(id => delete newBookmarks[id])
            return newBookmarks
        })

        // Check if this was the Happy Editting course and remove the flag
        const isHappyEdittingCourse = videosToDelete.some(video =>
            video.instructor === 'Happy Editting' && video.category === 'Video Editing'
        )

        if (isHappyEdittingCourse) {
            localStorage.removeItem(getStorageKey('happyEdittingCourseImported'))
            console.log('🎬 Happy Editting course import flag removed')
        }

        console.log('✅ Playlist and all related data deleted successfully')
        return true
    }

    const filteredVideos = videos.filter(video => {
        const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory
        return matchesCategory
    })

    const value = {
        videos,
        categories,
        selectedCategory,
        setSelectedCategory,
        favorites,
        watchHistory,
        notes,
        bookmarks,
        dailyActivity,
        dailyCompletedVideos,
        recentActivities,
        filteredVideos,
        addVideo,
        addBulkVideos,
        updateVideo,
        deleteVideo,
        toggleFavorite,
        addToWatchHistory,
        addNote,
        addBookmark,
        updateNote,
        deleteNote,
        // Category Management
        addCategory,
        editCategory,
        deleteCategory,
        // YouTube Playlist Import
        importYouTubePlaylist,
        // Playlist Management
        getPlaylistInfo,
        deletePlaylist,
        // Debug function
        debugStats
    }

    return (
        <VideoContext.Provider value={value}>
            {children}
        </VideoContext.Provider>
    )
} 