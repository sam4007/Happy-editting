import React, { useState, useEffect } from 'react'
import {
    Trophy, Star, Target, Clock, BookOpen, Brain, Zap, Flame,
    Award, CheckCircle, PlayCircle, TrendingUp, Calendar,
    Heart, Bookmark, FileText, Users, Crown, Gem, Sparkles,
    ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

const AchievementSystem = ({
    completedVideos,
    totalVideos,
    watchHistory,
    notes,
    bookmarks,
    dailyActivity,
    totalWatchTime,
    currentStreak,
    longestStreak,
    weeklyGoal,
    weeklyProgress
}) => {
    const { user } = useAuth()
    const [userAchievements, setUserAchievements] = useState({})
    const [userLevel, setUserLevel] = useState(1)
    const [userXP, setUserXP] = useState(0)
    const [showLevelUp, setShowLevelUp] = useState(false)
    const [recentUnlocks, setRecentUnlocks] = useState([])
    const [hasShownNotifications, setHasShownNotifications] = useState(false)
    const [lastCheckedLevel, setLastCheckedLevel] = useState(1)
    const [lastCheckedAchievements, setLastCheckedAchievements] = useState({})

    // XP calculation based on various activities
    const calculateXP = () => {
        let xp = 0

        // Base XP for completed videos
        xp += completedVideos * 50

        // Bonus XP for streaks
        xp += currentStreak * 10
        xp += longestStreak * 5

        // XP for engagement
        xp += Object.values(notes).reduce((acc, videoNotes) => acc + videoNotes.length, 0) * 5
        xp += Object.values(bookmarks).reduce((acc, videoBookmarks) => acc + videoBookmarks.length, 0) * 3

        // XP for watch time (1 XP per minute)
        xp += Math.floor(totalWatchTime / 60)

        // Weekly goal bonus
        if (weeklyProgress >= 100) {
            xp += 100
        }

        return xp
    }

    // Level calculation (every 1000 XP = 1 level)
    const calculateLevel = (xp) => {
        return Math.floor(xp / 1000) + 1
    }

    // Achievement definitions
    const achievements = [
        // Beginner Achievements
        {
            id: 'first_video',
            title: 'First Steps',
            description: 'Complete your first video',
            icon: PlayCircle,
            color: 'bg-blue-500',
            requirement: { type: 'completed_videos', value: 1 },
            xpReward: 50,
            category: 'beginner'
        },
        {
            id: 'first_week',
            title: 'Week Warrior',
            description: 'Complete videos for 7 consecutive days',
            icon: Calendar,
            color: 'bg-green-500',
            requirement: { type: 'streak', value: 7 },
            xpReward: 100,
            category: 'beginner'
        },
        {
            id: 'first_note',
            title: 'Note Taker',
            description: 'Create your first note',
            icon: FileText,
            color: 'bg-purple-500',
            requirement: { type: 'notes', value: 1 },
            xpReward: 25,
            category: 'beginner'
        },
        {
            id: 'first_bookmark',
            title: 'Bookmarker',
            description: 'Create your first bookmark',
            icon: Bookmark,
            color: 'bg-yellow-500',
            requirement: { type: 'bookmarks', value: 1 },
            xpReward: 25,
            category: 'beginner'
        },

        // Intermediate Achievements
        {
            id: 'video_master',
            title: 'Video Master',
            description: 'Complete 25 videos',
            icon: CheckCircle,
            color: 'bg-emerald-500',
            requirement: { type: 'completed_videos', value: 25 },
            xpReward: 200,
            category: 'intermediate'
        },
        {
            id: 'streak_master',
            title: 'Streak Master',
            description: 'Maintain a 14-day learning streak',
            icon: Flame,
            color: 'bg-orange-500',
            requirement: { type: 'streak', value: 14 },
            xpReward: 300,
            category: 'intermediate'
        },
        {
            id: 'note_collector',
            title: 'Note Collector',
            description: 'Create 50 notes',
            icon: FileText,
            color: 'bg-indigo-500',
            requirement: { type: 'notes', value: 50 },
            xpReward: 150,
            category: 'intermediate'
        },
        {
            id: 'time_investor',
            title: 'Time Investor',
            description: 'Invest 10 hours in learning',
            icon: Clock,
            color: 'bg-teal-500',
            requirement: { type: 'watch_time', value: 600 }, // 10 hours in minutes
            xpReward: 250,
            category: 'intermediate'
        },

        // Advanced Achievements
        {
            id: 'completionist',
            title: 'Completionist',
            description: 'Complete 100 videos',
            icon: Trophy,
            color: 'bg-red-500',
            requirement: { type: 'completed_videos', value: 100 },
            xpReward: 500,
            category: 'advanced'
        },
        {
            id: 'streak_legend',
            title: 'Streak Legend',
            description: 'Maintain a 30-day learning streak',
            icon: Crown,
            color: 'bg-pink-500',
            requirement: { type: 'streak', value: 30 },
            xpReward: 1000,
            category: 'advanced'
        },
        {
            id: 'knowledge_seeker',
            title: 'Knowledge Seeker',
            description: 'Create 100 notes',
            icon: Brain,
            color: 'bg-violet-500',
            requirement: { type: 'notes', value: 100 },
            xpReward: 400,
            category: 'advanced'
        },
        {
            id: 'time_master',
            title: 'Time Master',
            description: 'Invest 50 hours in learning',
            icon: Clock,
            color: 'bg-cyan-500',
            requirement: { type: 'watch_time', value: 3000 }, // 50 hours in minutes
            xpReward: 750,
            category: 'advanced'
        },

        // Expert Achievements
        {
            id: 'learning_champion',
            title: 'Learning Champion',
            description: 'Complete 250 videos',
            icon: Crown,
            color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
            requirement: { type: 'completed_videos', value: 250 },
            xpReward: 1000,
            category: 'expert'
        },
        {
            id: 'streak_champion',
            title: 'Streak Champion',
            description: 'Maintain a 60-day learning streak',
            icon: Flame,
            color: 'bg-gradient-to-r from-red-500 to-pink-500',
            requirement: { type: 'streak', value: 60 },
            xpReward: 2000,
            category: 'expert'
        },
        {
            id: 'knowledge_master',
            title: 'Knowledge Master',
            description: 'Create 250 notes',
            icon: Brain,
            color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
            requirement: { type: 'notes', value: 250 },
            xpReward: 800,
            category: 'expert'
        },
        {
            id: 'time_champion',
            title: 'Time Champion',
            description: 'Invest 100 hours in learning',
            icon: Clock,
            color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
            requirement: { type: 'watch_time', value: 6000 }, // 100 hours in minutes
            xpReward: 1500,
            category: 'expert'
        }
    ]

    // Check if achievement is unlocked
    const isAchievementUnlocked = (achievement) => {
        if (userAchievements[achievement.id]) return true

        const { type, value } = achievement.requirement

        switch (type) {
            case 'completed_videos':
                return completedVideos >= value
            case 'streak':
                return longestStreak >= value
            case 'notes':
                const totalNotes = Object.values(notes).reduce((acc, videoNotes) => acc + videoNotes.length, 0)
                return totalNotes >= value
            case 'bookmarks':
                const totalBookmarks = Object.values(bookmarks).reduce((acc, videoBookmarks) => acc + videoBookmarks.length, 0)
                return totalBookmarks >= value
            case 'watch_time':
                return totalWatchTime >= value
            default:
                return false
        }
    }

    // Get progress for achievement
    const getAchievementProgress = (achievement) => {
        const { type, value } = achievement.requirement

        let current = 0
        switch (type) {
            case 'completed_videos':
                current = completedVideos
                break
            case 'streak':
                current = longestStreak
                break
            case 'notes':
                current = Object.values(notes).reduce((acc, videoNotes) => acc + videoNotes.length, 0)
                break
            case 'bookmarks':
                current = Object.values(bookmarks).reduce((acc, videoBookmarks) => acc + videoBookmarks.length, 0)
                break
            case 'watch_time':
                current = totalWatchTime
                break
            default:
                current = 0
        }

        return Math.min((current / value) * 100, 100)
    }

    // Load user achievements from Firestore
    useEffect(() => {
        const loadUserAchievements = async () => {
            if (!user) return

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid))
                if (userDoc.exists()) {
                    const data = userDoc.data()
                    setUserAchievements(data.achievements || {})
                    setUserLevel(data.level || 1)
                    setUserXP(data.xp || 0)

                    // Load last shown notifications from localStorage
                    const lastShownKey = `lastShown_${user.uid}`
                    const lastShown = localStorage.getItem(lastShownKey)
                    console.log('Loading from localStorage:', { lastShownKey, lastShown })

                    if (lastShown) {
                        const parsed = JSON.parse(lastShown)
                        console.log('Parsed localStorage data:', parsed)
                        setLastCheckedLevel(parsed.level || 1)
                        setLastCheckedAchievements(parsed.achievements || {})
                    } else {
                        // First time user or no localStorage, set current state as last shown
                        const currentLevel = data.level || 1
                        const currentAchievements = data.achievements || {}
                        console.log('Setting baseline:', { currentLevel, currentAchievements })
                        setLastCheckedLevel(currentLevel)
                        setLastCheckedAchievements(currentAchievements)

                        // Save this as the baseline
                        const lastShownKey = `lastShown_${user.uid}`
                        localStorage.setItem(lastShownKey, JSON.stringify({
                            level: currentLevel,
                            achievements: currentAchievements
                        }))
                    }
                }
            } catch (error) {
                console.error('Error loading user achievements:', error)
            }
        }

        loadUserAchievements()
    }, [user])

    // Check for new achievements and level ups
    useEffect(() => {
        const checkAchievements = async () => {
            if (!user) return

            const newUnlocks = []
            const currentXP = calculateXP()
            const currentLevel = calculateLevel(currentXP)

            // Debug logging
            console.log('Level Check:', {
                currentLevel,
                lastCheckedLevel,
                userLevel,
                currentXP,
                shouldShow: currentLevel > lastCheckedLevel
            })

            // Only show level up notification if it's a new level up
            if (currentLevel > lastCheckedLevel) {
                setShowLevelUp(true)
                setUserLevel(currentLevel)
                setLastCheckedLevel(currentLevel)

                // Save to localStorage that we've shown this level up
                const lastShownKey = `lastShown_${user.uid}`
                const currentLastShown = JSON.parse(localStorage.getItem(lastShownKey) || '{}')
                localStorage.setItem(lastShownKey, JSON.stringify({
                    ...currentLastShown,
                    level: currentLevel,
                    achievements: userAchievements
                }))
            }

            // Check for new achievements that weren't unlocked before
            achievements.forEach(achievement => {
                const isUnlocked = isAchievementUnlocked(achievement)
                const wasUnlockedBefore = lastCheckedAchievements[achievement.id]

                if (isUnlocked && !wasUnlockedBefore && !userAchievements[achievement.id]) {
                    newUnlocks.push(achievement)
                    userAchievements[achievement.id] = {
                        unlockedAt: new Date().toISOString(),
                        xpReward: achievement.xpReward
                    }
                }
            })

            if (newUnlocks.length > 0) {
                setRecentUnlocks(newUnlocks)
                setUserAchievements({ ...userAchievements })

                // Save to Firestore
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        achievements: userAchievements,
                        level: currentLevel,
                        xp: currentXP,
                        lastUpdated: new Date().toISOString()
                    })
                } catch (error) {
                    console.error('Error saving achievements:', error)
                }

                // Save to localStorage that we've shown these achievements
                const lastShownKey = `lastShown_${user.uid}`
                const currentLastShown = JSON.parse(localStorage.getItem(lastShownKey) || '{}')
                localStorage.setItem(lastShownKey, JSON.stringify({
                    ...currentLastShown,
                    level: currentLevel,
                    achievements: userAchievements
                }))
            }

            // Update last checked state
            setLastCheckedLevel(currentLevel)
            setLastCheckedAchievements(userAchievements)
            setUserXP(currentXP)
        }

        checkAchievements()
    }, [completedVideos, currentStreak, longestStreak, notes, bookmarks, totalWatchTime, user])

    // Auto-dismiss notifications after 5 seconds
    useEffect(() => {
        if (showLevelUp || recentUnlocks.length > 0) {
            const timer = setTimeout(() => {
                setShowLevelUp(false)
                setRecentUnlocks([])
            }, 5000)

            return () => clearTimeout(timer)
        }
    }, [showLevelUp, recentUnlocks.length])

    // Clear notifications when user changes (but don't reset the tracking state)
    useEffect(() => {
        setShowLevelUp(false)
        setRecentUnlocks([])
    }, [user])

    // Group achievements by category
    const groupedAchievements = achievements.reduce((acc, achievement) => {
        if (!acc[achievement.category]) {
            acc[achievement.category] = []
        }
        acc[achievement.category].push(achievement)
        return acc
    }, {})

    const categoryNames = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        expert: 'Expert'
    }

    const categoryColors = {
        beginner: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
        intermediate: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
        advanced: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
        expert: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Level and XP Display */}
            <div className="glass-card-frosted p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                Level {userLevel}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {userXP} XP • {userXP % 1000}/1000 to next level
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {userXP}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total XP</div>
                        {/* Debug button - remove after testing */}
                        <button
                            onClick={() => {
                                console.log('Manual level up trigger')
                                setShowLevelUp(true)
                                setUserLevel(userLevel + 1)
                            }}
                            className="mt-2 px-2 py-1 text-xs bg-red-500 text-white rounded"
                        >
                            Test Level Up
                        </button>
                        <button
                            onClick={() => {
                                const lastShownKey = `lastShown_${user.uid}`
                                localStorage.removeItem(lastShownKey)
                                console.log('Cleared localStorage for:', lastShownKey)
                                window.location.reload()
                            }}
                            className="mt-1 px-2 py-1 text-xs bg-blue-500 text-white rounded"
                        >
                            Clear Storage
                        </button>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(userXP % 1000) / 10}%` }}
                    />
                </div>

                {/* Recent Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                            {completedVideos}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Videos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                            {currentStreak}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                            {Object.values(notes).reduce((acc, videoNotes) => acc + videoNotes.length, 0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Notes</div>
                    </div>
                </div>
            </div>

            {/* Achievements by Category */}
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
                <div key={category} className="glass-card-frosted p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {categoryNames[category]} Achievements
                        </h3>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {categoryAchievements.filter(a => isAchievementUnlocked(a)).length}/{categoryAchievements.length}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {categoryAchievements.map((achievement) => {
                            const unlocked = isAchievementUnlocked(achievement)
                            const progress = getAchievementProgress(achievement)

                            return (
                                <div
                                    key={achievement.id}
                                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 ${unlocked
                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                                        }`}
                                >
                                    <div className="flex items-start space-x-2 sm:space-x-3">
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${achievement.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                                            <achievement.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={`font-medium text-xs sm:text-sm ${unlocked
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {achievement.title}
                                                </h4>
                                                {unlocked && (
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                                            +{achievement.xpReward} XP
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className={`text-xs mb-2 ${unlocked
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {achievement.description}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-500 ${unlocked
                                                        ? 'bg-green-500'
                                                        : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Progress: {Math.round(progress)}%
                                                </span>
                                                {unlocked && (
                                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                                        ✓ Unlocked
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}

            {/* Level Up Modal */}
            {showLevelUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLevelUp(false)} />
                    <div className="glass-card-frosted p-6 sm:p-8 max-w-md w-full relative text-center">
                        <button
                            onClick={() => setShowLevelUp(false)}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl sm:text-2xl"
                        >
                            ×
                        </button>
                        <div className="mb-4 sm:mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Level Up! 🎉
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                Congratulations! You've reached Level {userLevel}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                                    +{userXP % 1000} XP
                                </div>
                                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                                    Experience gained
                                </div>
                            </div>

                            <button
                                onClick={() => setShowLevelUp(false)}
                                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all duration-300"
                            >
                                Continue Learning
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Unlocks Toast */}
            {recentUnlocks.length > 0 && (
                <div className="fixed bottom-4 right-2 sm:right-4 z-50 space-y-2 max-w-xs sm:max-w-sm">
                    {recentUnlocks.map((achievement, index) => (
                        <div
                            key={achievement.id}
                            className="glass-card-frosted p-3 sm:p-4 animate-slide-in-right relative"
                            style={{ animationDelay: `${index * 0.2}s` }}
                        >
                            <button
                                onClick={() => setRecentUnlocks([])}
                                className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                ×
                            </button>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${achievement.color} rounded-full flex items-center justify-center`}>
                                    <achievement.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                        {achievement.title}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        +{achievement.xpReward} XP
                                    </p>
                                </div>
                            </div>
                            {/* Auto-dismiss progress bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-3">
                                <div
                                    className="bg-green-500 h-1 rounded-full transition-all duration-5000 ease-linear"
                                    style={{ width: '0%' }}
                                    onAnimationStart={(e) => {
                                        setTimeout(() => {
                                            e.target.style.width = '100%'
                                        }, 100)
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AchievementSystem 