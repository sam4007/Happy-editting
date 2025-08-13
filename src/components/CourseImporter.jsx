


















































































































































































import React, { useState, useEffect } from 'react'
import { Download, Upload, CheckCircle, AlertCircle, Youtube, Link, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useVideo } from '../contexts/VideoContext'

const CourseImporter = ({ isOpen, onClose }) => {
    const { addBulkVideos, videos, importYouTubePlaylist, categories, addCategory } = useVideo()
    const [activeTab, setActiveTab] = useState('youtube') // 'youtube' or 'happy-editting'
    const [isImporting, setIsImporting] = useState(false)
    const [importStatus, setImportStatus] = useState('')
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

    // YouTube import states
    const [step, setStep] = useState(1) // 1: URL input, 2: Course Details, 3: Import Preview
    const [playlistUrl, setPlaylistUrl] = useState('')
    const [playlistId, setPlaylistId] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newCategory, setNewCategory] = useState('')
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
    const [courseTitle, setCourseTitle] = useState('')
    const [instructor, setInstructor] = useState('')
    const [fetchedVideos, setFetchedVideos] = useState([])
    const [playlistInfo, setPlaylistInfo] = useState(null)
    const [error, setError] = useState('')
    const [serverStatus, setServerStatus] = useState(null)
    const [fetchProgress, setFetchProgress] = useState('')

    const API_BASE_URL = 'http://localhost:5000/api'
    const MAX_RETRIES = 3

    // Check server status when component mounts or tab changes
    useEffect(() => {
        if (activeTab === 'youtube') {
            checkServerStatus()
        }
    }, [activeTab])

    // Reset states when tab changes
    useEffect(() => {
        setError('')
        setImportStatus('')
        setShowDuplicateWarning(false)
        if (activeTab === 'youtube') {
            setStep(1)
            setPlaylistUrl('')
            setFetchedVideos([])
            setPlaylistInfo(null)
        }
    }, [activeTab])

    // Check server status
    const checkServerStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`)
            const data = await response.json()
            setServerStatus(data)
            return data
        } catch (error) {
            console.error('Server not available:', error)
            setServerStatus({ status: 'ERROR', message: 'Server not running', hasApiKey: false })
            return null
        }
    }

    // Extract playlist ID from YouTube URL
    const extractPlaylistId = (url) => {
        const regex = /[?&]list=([^#&?]*)/
        const match = url.match(regex)
        return match ? match[1] : null
    }

    // Fetch real playlist data from YouTube API
    const fetchRealPlaylistData = async (playlistId, attempt = 1) => {
        try {
            setFetchProgress(`Fetching playlist data... (Attempt ${attempt}/${MAX_RETRIES})`)

            const response = await fetch(`${API_BASE_URL}/playlist/${playlistId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(60000) // 60 second timeout
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`)
            }

            setFetchProgress('')
            return data
        } catch (error) {
            console.error(`Error fetching playlist (attempt ${attempt}):`, error)

            if (attempt < MAX_RETRIES && !error.name?.includes('AbortError')) {
                const delay = Math.pow(2, attempt) * 1000
                setFetchProgress(`Retrying in ${delay / 1000} seconds...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return fetchRealPlaylistData(playlistId, attempt + 1)
            }
            throw error
        }
    }

    // Handle YouTube playlist fetch
    const handleFetchPlaylist = async () => {
        setError('')
        setIsImporting(true)
        setFetchProgress('')

        const serverStatus = await checkServerStatus()
        if (!serverStatus || serverStatus.status === 'ERROR') {
            setError('Backend server is not running. Please start the server with "npm run server"')
            setIsImporting(false)
            return
        }

        if (!serverStatus.hasApiKey) {
            setError('YouTube API key is not configured. Please check your .env file and restart the server.')
            setIsImporting(false)
            return
        }

        if (!playlistUrl.trim()) {
            setError('Please enter a YouTube playlist URL')
            setIsImporting(false)
            return
        }

        const extractedId = extractPlaylistId(playlistUrl)
        if (!extractedId) {
            setError('Invalid YouTube playlist URL. Please check the URL and try again.')
            setIsImporting(false)
            return
        }

        setPlaylistId(extractedId)
        setFetchProgress('Connecting to YouTube API...')

        try {
            const data = await fetchRealPlaylistData(extractedId)

            if (data.status === 'success') {
                setPlaylistInfo(data.playlist)
                setFetchedVideos(data.videos)
                setCourseTitle(data.playlist.title)
                setInstructor(data.playlist.channelTitle)
                setStep(2)
                setError('')
            } else {
                throw new Error(data.message || 'Failed to fetch playlist data')
            }
        } catch (error) {
            console.error('Error fetching playlist:', error)
            if (error.message.includes('quota')) {
                setError('YouTube API quota exceeded. Please try again tomorrow or upgrade your quota limits.')
            } else if (error.message.includes('API key')) {
                setError('YouTube API key is invalid. Please check your .env file.')
            } else if (error.message.includes('not found')) {
                setError('Playlist not found. Please check the URL and ensure the playlist is public.')
            } else {
                setError(`Failed to fetch playlist: ${error.message}`)
            }
        } finally {
            setIsImporting(false)
            setFetchProgress('')
        }
    }

    // Handle YouTube playlist import
    const handleImportYouTubePlaylist = () => {
        if (!selectedCategory && !newCategory) {
            setError('Please select or create a category')
            return
        }

        const categoryToUse = newCategory || selectedCategory

        if (newCategory && !categories.includes(newCategory)) {
            addCategory(newCategory)
        }

        const playlistData = {
            playlistTitle: courseTitle || playlistInfo.title,
            instructor: instructor || playlistInfo.channelTitle,
            category: categoryToUse,
            videos: fetchedVideos.map(video => ({
                ...video,
                category: categoryToUse,
                instructor: instructor || playlistInfo.channelTitle,
                source: 'youtube',
                importedBy: 'YouTubeAPI'
            })),
            playlistInfo: {
                ...playlistInfo,
                importedBy: 'YouTubeAPI'
            },
            isReal: true,
            importedBy: 'YouTubeAPI'
        }

        importYouTubePlaylist(playlistData)
        setImportStatus(`Successfully imported ${fetchedVideos.length} videos from YouTube playlist!`)

        setTimeout(() => {
            onClose()
            setImportStatus('')
            setStep(1)
            setPlaylistUrl('')
            setFetchedVideos([])
            setPlaylistInfo(null)
        }, 2000)
    }

    // Happy Editting course data
    const happyEdittingCourse = [
        // PRO MINDSET - 6 Lessons
        {
            title: 'Mindset: "It\'s Pretty But I Don\'t Feel Anything"',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '15:30',
            url: 'https://player.vimeo.com/video/588437617',
            description: 'Learn about developing the right mindset for creative video editing.',
            rating: 4.8,
            module: 'PRO MINDSET'
        },
        {
            title: 'Mindset: The Craft, the Client, and the Crowd',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:45',
            url: 'https://player.vimeo.com/video/588437637',
            description: 'Understanding the balance between artistic vision and client needs.',
            rating: 4.7,
            module: 'PRO MINDSET'
        },
        {
            title: 'Mindset: The Art of Disassociation',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '12:20',
            url: 'https://player.vimeo.com/video/588437657',
            description: 'Learn how to separate yourself from your work for better creativity.',
            rating: 4.6,
            module: 'PRO MINDSET'
        },
        {
            title: 'Mindset: Happy Accidents',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '14:15',
            url: 'https://player.vimeo.com/video/588437682',
            description: 'Embrace unexpected moments in your creative process.',
            rating: 4.9,
            module: 'PRO MINDSET'
        },
        {
            title: 'Mindset: Growing Your Creative Taste',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:30',
            url: 'https://player.vimeo.com/video/588437732',
            description: 'Develop and refine your aesthetic sensibilities.',
            rating: 4.8,
            module: 'PRO MINDSET'
        },
        {
            title: 'Mindset: The Hook Factor (Top 3 Techniques)',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:45',
            url: 'https://player.vimeo.com/video/588437791?h=c7e24a0a7a',
            description: 'Master the techniques that grab and hold viewer attention.',
            rating: 4.9,
            module: 'PRO MINDSET'
        },

        // PROJECT BREAKDOWNS - 11 Lessons
        {
            title: 'Ezra Cohen: Hillsong Y&F - Let Go Music Video',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '28:30',
            url: 'https://player.vimeo.com/video/588440758',
            description: 'Detailed breakdown of a professional music video project.',
            rating: 4.8,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'Ezra Cohen: The Knowledge of Good and Evil',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:15',
            url: 'https://player.vimeo.com/video/870281780',
            description: 'Behind-the-scenes look at a creative storytelling project.',
            rating: 4.7,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'Markus Gjengaar - Idiom Commercial',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '25:45',
            url: 'https://player.vimeo.com/video/827334437?h=94eb87da42',
            description: 'Commercial project breakdown and techniques.',
            rating: 4.6,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'Jakub Blank - John Mark McMillan Visualizer',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '20:30',
            url: 'https://player.vimeo.com/video/727131040?h=38d0950b3c',
            description: 'Music visualizer creation process and techniques.',
            rating: 4.8,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'Ezra Cohen: Saints & Comrades',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:20',
            url: 'https://player.vimeo.com/video/588441468?h=86b1f4cc7a',
            description: 'Creative music video project analysis.',
            rating: 4.7,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'Ezra Cohen: Daniella Mason Concert Visuals',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '26:15',
            url: 'https://player.vimeo.com/video/480020123',
            description: 'Behind-the-scenes of concert visuals production.',
            rating: 4.8,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'Sam Taylor: No Mileage Lyric Video',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:30',
            url: 'https://player.vimeo.com/video/683916775',
            description: 'Breakdown of a creative lyric video project.',
            rating: 4.6,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'EZCO: Brand Video Pre-Production',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:45',
            url: 'https://player.vimeo.com/video/781268817?h=b119d6a686',
            description: 'Pre-production planning for brand video projects.',
            rating: 4.7,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'EZCO: Brand Video VFX',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '28:20',
            url: 'https://player.vimeo.com/video/781269002?h=6e14c2bfca',
            description: 'Visual effects workflow for brand video production.',
            rating: 4.8,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'EZCO: Brand Video Production',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '31:15',
            url: 'https://player.vimeo.com/video/781269243?h=486e819bf9',
            description: 'Production process for professional brand videos.',
            rating: 4.7,
            module: 'PROJECT BREAKDOWNS'
        },
        {
            title: 'EZCO: Brand Video Assembly',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '25:30',
            url: 'https://player.vimeo.com/video/781269144?h=29ecad0105',
            description: 'Final assembly and delivery of brand video projects.',
            rating: 4.6,
            module: 'PROJECT BREAKDOWNS'
        },

        // NEW PROJECT WORKFLOW - 4 Lessons
        {
            title: 'Workflow: How I Start Every New Project',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:30',
            url: 'https://player.vimeo.com/video/588438433?h=e3a8f81a8b',
            description: 'Essential steps for beginning any video editing project.',
            rating: 4.9,
            module: 'NEW PROJECT WORKFLOW'
        },
        {
            title: 'Workflow: The "Selects" Method',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:45',
            url: 'https://player.vimeo.com/video/588438569?h=5ded186652',
            description: 'Efficient method for organizing and selecting footage.',
            rating: 4.8,
            module: 'NEW PROJECT WORKFLOW'
        },
        {
            title: 'Workflow: Using Proxies to Edit Large Projects',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '21:15',
            url: 'https://player.vimeo.com/video/588438484?h=848f8a2348',
            description: 'Handle large projects efficiently with proxy workflows.',
            rating: 4.7,
            module: 'NEW PROJECT WORKFLOW'
        },
        {
            title: 'Workflow: The Best 2 Export Settings',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '14:30',
            url: 'https://player.vimeo.com/video/588438740',
            description: 'Optimal export settings for various delivery formats.',
            rating: 4.6,
            module: 'NEW PROJECT WORKFLOW'
        },

        // CREATIVE TOOLS - 10 Lessons
        {
            title: 'Blending Modes Explained in 60 Seconds',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '1:00',
            url: 'https://player.vimeo.com/video/588446103',
            description: 'Quick guide to understanding and using blending modes.',
            rating: 4.5,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Top 11 Free Premiere Pro Effects',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:30',
            url: 'https://player.vimeo.com/video/588437995?h=bfe9dd93d7',
            description: 'Best free effects available in Premiere Pro.',
            rating: 4.8,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Low Budget VFX with Masking',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:45',
            url: 'https://player.vimeo.com/video/588438066?h=7c1d5b34d7',
            description: 'Create impressive visual effects on a budget using masking.',
            rating: 4.7,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Top Free Fonts',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '15:20',
            url: 'https://player.vimeo.com/video/588444533?h=e51445a72c',
            description: 'Best free fonts for video editing and motion graphics.',
            rating: 4.6,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: 3 Retouching Methods',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '17:30',
            url: 'https://player.vimeo.com/video/588438293?h=167f7f9c76',
            description: 'Essential video retouching techniques.',
            rating: 4.7,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Analog Textures',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '20:15',
            url: 'https://player.vimeo.com/video/727129033?h=5197056409',
            description: 'Using analog textures to enhance your video projects.',
            rating: 4.8,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Lofi Animation',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:45',
            url: 'https://player.vimeo.com/video/727130326?h=08a21e8659',
            description: 'Creating stylized lofi animation effects.',
            rating: 4.7,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Multicam Sequences',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:30',
            url: 'https://player.vimeo.com/video/588438117?h=2669271a62',
            description: 'Working with multicam sequences for complex projects.',
            rating: 4.6,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Color Grading 101',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '25:45',
            url: 'https://player.vimeo.com/video/588438154?h=544b514b98',
            description: 'Fundamentals of color grading for video.',
            rating: 4.8,
            module: 'CREATIVE TOOLS'
        },
        {
            title: 'Creative: Overlays 101',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:20',
            url: 'https://player.vimeo.com/video/581454767',
            description: 'Using overlays to enhance your video content.',
            rating: 4.5,
            module: 'CREATIVE TOOLS'
        },

        // AFTER EFFECTS - 8 Lessons
        {
            title: 'AE: What Only After Effects Can Do',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '20:15',
            url: 'https://player.vimeo.com/video/588445591?h=6b57f37683',
            description: 'Unique capabilities that make After Effects essential.',
            rating: 4.8,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: Intro to 3D Animation',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '25:30',
            url: 'https://player.vimeo.com/video/588445748?h=a8bb0ae8e1',
            description: 'Getting started with 3D animation in After Effects.',
            rating: 4.7,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: Alpha Channel + Track Mattes',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:45',
            url: 'https://player.vimeo.com/video/588445843?h=c7d5e439a7',
            description: 'Master transparency and compositing techniques.',
            rating: 4.6,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: Intro to Expressions',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:00',
            url: 'https://player.vimeo.com/video/588445965?h=ed7cb29b85',
            description: 'Introduction to expressions for advanced animation.',
            rating: 4.8,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: Creative Ways to Use Wiggle Expression',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:30',
            url: 'https://player.vimeo.com/video/709265560?h=61d8d3d5df',
            description: 'Creative applications of the wiggle expression.',
            rating: 4.8,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: 11 Tricks Every Editor Should Know',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '26:30',
            url: 'https://player.vimeo.com/video/714152947?h=8fda0919a3',
            description: 'Essential After Effects tricks for video editors.',
            rating: 4.9,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: Top 9 Paid AE Plugins',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:15',
            url: 'https://player.vimeo.com/video/855094469?h=3cb085fe01',
            description: 'Review of the best paid After Effects plugins.',
            rating: 4.7,
            module: 'AFTER EFFECTS'
        },
        {
            title: 'AE: 3 Creative Ways to Use CRT Emulator',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '21:45',
            url: 'https://player.vimeo.com/video/712973284?h=b2b2e6acc7',
            description: 'Creative applications of CRT emulator effects.',
            rating: 4.8,
            module: 'AFTER EFFECTS'
        },

        // BUSINESS + RELATIONSHIPS - 5 Lessons
        {
            title: 'Business: How I Make 6 Figures as a Video Editor',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '32:15',
            url: 'https://player.vimeo.com/video/610203792',
            description: 'Business strategies for successful video editing career.',
            rating: 4.9,
            module: 'BUSINESS + RELATIONSHIPS'
        },
        {
            title: 'Business: How Much Should I Charge',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:30',
            url: 'https://player.vimeo.com/video/588440338?h=e287f92512',
            description: 'Pricing strategies for video editing services.',
            rating: 4.8,
            module: 'BUSINESS + RELATIONSHIPS'
        },
        {
            title: 'Business: Sending Estimates + Tracking Time',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:45',
            url: 'https://player.vimeo.com/video/588440432?h=06b7894c47',
            description: 'Professional practices for client communication and time management.',
            rating: 4.7,
            module: 'BUSINESS + RELATIONSHIPS'
        },
        {
            title: 'Business: Pay Follows Passion',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:30',
            url: 'https://player.vimeo.com/video/588440488?h=483badb693',
            description: 'Building a career around your passion for video editing.',
            rating: 4.8,
            module: 'BUSINESS + RELATIONSHIPS'
        },
        {
            title: 'Business: Staff vs Freelance',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:15',
            url: 'https://player.vimeo.com/video/588440545?h=6c06cd7e8c',
            description: 'Choosing between staff positions and freelance work.',
            rating: 4.6,
            module: 'BUSINESS + RELATIONSHIPS'
        },

        // CRT MASTERCLASS - 5 Lessons
        {
            title: 'CRT Master: Choosing a CRT Monitor',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:30',
            url: 'https://player.vimeo.com/video/680686235',
            description: 'Guide to selecting the right CRT monitor for your projects.',
            rating: 4.6,
            module: 'CRT MASTERCLASS'
        },
        {
            title: 'CRT Master: Capture Workflow',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '21:15',
            url: 'https://player.vimeo.com/video/680686350',
            description: 'Workflow for capturing CRT footage.',
            rating: 4.7,
            module: 'CRT MASTERCLASS'
        },

        // 3D PHOTO MASTERCLASS - Sample lessons
        {
            title: '3D Photo Master: Intro',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '12:45',
            url: 'https://player.vimeo.com/video/693592167',
            description: 'Introduction to creating 3D photo effects.',
            rating: 4.8,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Photoshop Masking',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '28:30',
            url: 'https://player.vimeo.com/video/693592286?h=f98cb67348',
            description: 'Advanced masking techniques in Photoshop for 3D photo effects.',
            rating: 4.7,
            module: '3D PHOTO MASTERCLASS'
        },

        // GENRE BREAKDOWNS - 6 Lessons
        {
            title: 'Genre: Genre Breakdowns 101',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:30',
            url: 'https://player.vimeo.com/video/588438807?h=5f3bc2243d',
            description: 'Introduction to understanding different video genres.',
            rating: 4.7,
            module: 'GENRE BREAKDOWNS'
        },
        {
            title: 'Genre: Abstract Fashion Film',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:45',
            url: 'https://player.vimeo.com/video/656735165',
            description: 'Creating abstract fashion film content.',
            rating: 4.8,
            module: 'GENRE BREAKDOWNS'
        },
        {
            title: 'Genre: Tour Visuals',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '20:15',
            url: 'https://player.vimeo.com/video/656752112',
            description: 'Design and create tour visuals for live performances.',
            rating: 4.7,
            module: 'GENRE BREAKDOWNS'
        },
        {
            title: 'Genre: 30s Commercial',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:30',
            url: 'https://player.vimeo.com/video/656756672',
            description: 'Crafting effective 30-second commercials.',
            rating: 4.6,
            module: 'GENRE BREAKDOWNS'
        },
        {
            title: 'Final: Abstract Fashion Video',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '28:20',
            url: 'https://player.vimeo.com/video/657483230',
            description: 'Final project: Create a complete abstract fashion video.',
            rating: 4.8,
            module: 'GENRE BREAKDOWNS'
        },
        {
            title: 'Final: 30s Commercial',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:45',
            url: 'https://player.vimeo.com/video/657483882',
            description: 'Final project: Create a complete 30-second commercial.',
            rating: 4.7,
            module: 'GENRE BREAKDOWNS'
        },

        // TOUR VISUALS MASTERCLASS - 11 Lessons
        {
            title: 'Tour Visuals Master: Introduction',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '15:30',
            url: 'https://player.vimeo.com/video/479983224',
            description: 'Introduction to tour visuals and live performance graphics.',
            rating: 4.8,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Theory',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:15',
            url: 'https://player.vimeo.com/video/683560102',
            description: 'Theoretical foundations of tour visual design.',
            rating: 4.7,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Toolbelt',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:45',
            url: 'https://player.vimeo.com/video/479986875',
            description: 'Essential tools for creating tour visuals.',
            rating: 4.6,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Intro to Custom Visuals in AE',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '26:30',
            url: 'https://player.vimeo.com/video/479983739',
            description: 'Creating custom visuals using After Effects.',
            rating: 4.8,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Retro Grid in AE',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:15',
            url: 'https://player.vimeo.com/video/479984314',
            description: 'Creating retro grid effects in After Effects.',
            rating: 4.7,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Starscape in AE',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '21:45',
            url: 'https://player.vimeo.com/video/479985394',
            description: 'Creating starscape backgrounds in After Effects.',
            rating: 4.8,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Creating Seamless Loops',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:30',
            url: 'https://player.vimeo.com/video/479985539',
            description: 'Techniques for creating seamless looping animations.',
            rating: 4.9,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Odd-Shaped LED Walls',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '23:15',
            url: 'https://player.vimeo.com/video/480020586',
            description: 'Designing content for non-standard LED wall configurations.',
            rating: 4.7,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Resolume Arena + Timecode Syncing',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '27:45',
            url: 'https://player.vimeo.com/video/480020679',
            description: 'Using Resolume Arena for live visual performances.',
            rating: 4.8,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Tour Visuals Master: Concert Visuals Project Breakdown',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '32:20',
            url: 'https://player.vimeo.com/video/480020123',
            description: 'Complete breakdown of a concert visuals project.',
            rating: 4.9,
            module: 'TOUR VISUALS MASTERCLASS'
        },
        {
            title: 'Bonus: Consumer Projector Shootout',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:45',
            url: 'https://player.vimeo.com/video/689367823',
            description: 'Comparison of consumer projectors for visual performances.',
            rating: 4.5,
            module: 'TOUR VISUALS MASTERCLASS'
        },

        // BLENDER 3D MASTERCLASS - 11 Lessons
        {
            title: 'Blender 3D Master: Intro',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '15:20',
            url: 'https://player.vimeo.com/video/743500671?h=15e85a9562',
            description: 'Getting started with Blender for video editing.',
            rating: 4.8,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Navigating Blender',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:45',
            url: 'https://player.vimeo.com/video/743502817?h=2a73c60193',
            description: 'Learn to navigate the Blender interface efficiently.',
            rating: 4.7,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Installing Add-Ons',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '12:30',
            url: 'https://player.vimeo.com/video/743506111?h=7bc8342888',
            description: 'How to install and manage Blender add-ons.',
            rating: 4.6,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Project #1 – 3D Animated Logo',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '35:45',
            url: 'https://player.vimeo.com/video/743506749?h=0754b0da9c',
            description: 'Create a professional 3D animated logo in Blender.',
            rating: 4.9,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Materials',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:15',
            url: 'https://player.vimeo.com/video/743509072?h=88237abbdb',
            description: 'Understanding and creating materials in Blender.',
            rating: 4.8,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Render Preview',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:30',
            url: 'https://player.vimeo.com/video/743510272?h=bb4830073d',
            description: 'Setting up and using render previews effectively.',
            rating: 4.7,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Lighting',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:45',
            url: 'https://player.vimeo.com/video/743507726?h=7e2aeace74',
            description: 'Mastering lighting techniques in Blender.',
            rating: 4.8,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Animation',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '28:20',
            url: 'https://player.vimeo.com/video/743508322?h=883cd7c047',
            description: 'Animation fundamentals and keyframe techniques.',
            rating: 4.9,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Export Settings',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '14:15',
            url: 'https://player.vimeo.com/video/743510713?h=03e794ab0e',
            description: 'Optimal export settings for different use cases.',
            rating: 4.6,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Project #2 – 3D Terrain Scene',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '41:30',
            url: 'https://player.vimeo.com/video/743511284?h=8a09bbc408',
            description: 'Create a realistic 3D terrain scene from scratch.',
            rating: 4.8,
            module: 'BLENDER 3D MASTERCLASS'
        },
        {
            title: 'Blender 3D Master: Project #3 – Scifi Warehouse',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '38:15',
            url: 'https://player.vimeo.com/video/743582176?h=31f5c2719a',
            description: 'Build a complete sci-fi warehouse environment.',
            rating: 4.9,
            module: 'BLENDER 3D MASTERCLASS'
        },

        // 3D PHOTO MASTERCLASS - 10 Lessons
        {
            title: '3D Photo Master: Intro',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '12:45',
            url: 'https://player.vimeo.com/video/693592167',
            description: 'Introduction to creating 3D photo effects.',
            rating: 4.8,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Selecting a Photo',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '15:30',
            url: 'https://player.vimeo.com/video/693592232?h=e2db15a8ae',
            description: 'How to choose the right photos for 3D effects.',
            rating: 4.7,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Photoshop Masking',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '28:30',
            url: 'https://player.vimeo.com/video/693592286?h=f98cb67348',
            description: 'Advanced masking techniques in Photoshop for 3D photo effects.',
            rating: 4.7,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: After Effects Construction',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '32:15',
            url: 'https://player.vimeo.com/video/693592503?h=28d353a38b',
            description: 'Building 3D photo effects in After Effects.',
            rating: 4.8,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Camera Movement',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '24:45',
            url: 'https://player.vimeo.com/video/693592532?h=b8edda91dd',
            description: 'Creating dynamic camera movements in 3D photo animations.',
            rating: 4.9,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Additional Elements',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:20',
            url: 'https://player.vimeo.com/video/693592579?h=e510cade37',
            description: 'Adding extra elements to enhance 3D photo effects.',
            rating: 4.7,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Text & Details',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '17:45',
            url: 'https://player.vimeo.com/video/693592662?h=ab90a10c9a',
            description: 'Incorporating text and fine details into 3D photos.',
            rating: 4.6,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Puppet Tool',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '21:30',
            url: 'https://player.vimeo.com/video/693592777?h=ea93903fe3',
            description: 'Using the puppet tool for advanced 3D photo animations.',
            rating: 4.8,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Crowds',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '26:15',
            url: 'https://player.vimeo.com/video/693603666?h=032df38b28',
            description: 'Creating 3D effects with crowd scenes and multiple subjects.',
            rating: 4.7,
            module: '3D PHOTO MASTERCLASS'
        },
        {
            title: '3D Photo Master: Keyframe Graphs',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '23:45',
            url: 'https://player.vimeo.com/video/693603873?h=d54fe8417c',
            description: 'Advanced keyframe manipulation using graph editor.',
            rating: 4.8,
            module: '3D PHOTO MASTERCLASS'
        },

        // CRT MASTERCLASS - 5 Lessons (Complete)
        {
            title: 'CRT Master: Choosing a CRT Monitor',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '16:30',
            url: 'https://player.vimeo.com/video/680686235',
            description: 'Guide to selecting the right CRT monitor for your projects.',
            rating: 4.6,
            module: 'CRT MASTERCLASS'
        },
        {
            title: 'CRT Master: Capture Workflow',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '21:15',
            url: 'https://player.vimeo.com/video/680686350',
            description: 'Workflow for capturing CRT footage.',
            rating: 4.7,
            module: 'CRT MASTERCLASS'
        },
        {
            title: 'CRT Master: Editing Workflow',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '19:45',
            url: 'https://player.vimeo.com/video/680686461',
            description: 'Post-production workflow for CRT footage.',
            rating: 4.6,
            module: 'CRT MASTERCLASS'
        },
        {
            title: 'CRT Emulator',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '18:30',
            url: 'https://player.vimeo.com/video/669849362',
            description: 'Using CRT emulator effects for vintage looks.',
            rating: 4.8,
            module: 'CRT MASTERCLASS'
        },
        {
            title: 'CRT Emulator Tutorial',
            instructor: 'Happy Editting',
            category: 'Video Editing',
            duration: '22:15',
            url: 'https://player.vimeo.com/video/672522433',
            description: 'Step-by-step tutorial for CRT emulator effects.',
            rating: 4.7,
            module: 'CRT MASTERCLASS'
        }
    ]

    // Check if Happy Editting course is already imported
    const isAlreadyImported = videos.some(video =>
        video.instructor === 'Happy Editting' &&
        video.category === 'Video Editing' &&
        video.module
    )

    // Handle Happy Editting course import
    const handleImportHappyEdittingCourse = async () => {
        if (isAlreadyImported && !showDuplicateWarning) {
            setShowDuplicateWarning(true)
            return
        }

        setIsImporting(true)
        setImportStatus('Importing Happy Editting course...')

        try {
            const existingTitles = videos.map(v => v.title.toLowerCase())
            const newVideos = happyEdittingCourse.filter(video =>
                !existingTitles.includes(video.title.toLowerCase())
            )

            if (newVideos.length > 0) {
                addBulkVideos(newVideos)
                setImportStatus(`Successfully imported ${newVideos.length} new videos from Happy Editting course!`)
            } else {
                setImportStatus('All videos from Happy Editting course are already imported!')
            }

            setTimeout(() => {
                onClose()
                setImportStatus('')
                setShowDuplicateWarning(false)
            }, 2000)

        } catch (error) {
            console.error('Error importing course:', error)
            setImportStatus('Error importing course. Please try again.')
        } finally {
            setIsImporting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all">
                    {/* Header with Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 pb-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Import Course
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex px-6 pt-4">
                            <button
                                onClick={() => setActiveTab('youtube')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'youtube'
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-2 border-red-500'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Youtube className="w-4 h-4" />
                                <span>Import YouTube Playlist</span>
                                {serverStatus?.status === 'ERROR' && (
                                    <span className="text-red-500 text-xs">⚠️ Server Offline</span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('happy-editting')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'happy-editting'
                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Download className="w-4 h-4" />
                                <span>Import Course</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'youtube' ? (
                            <div>
                                {/* YouTube Import Content */}
                                {step === 1 && (
                                    <div>
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                                <Youtube className="w-8 h-8 text-red-600 dark:text-red-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Import YouTube Playlist
                                            </h3>
                                            <div className="flex items-center justify-center space-x-2 mb-4">
                                                {serverStatus?.status === 'OK' ? (
                                                    <>
                                                        <Wifi className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm text-green-600 dark:text-green-400">
                                                            YouTube API Integration Active
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <WifiOff className="w-4 h-4 text-red-500" />
                                                        <span className="text-sm text-red-600 dark:text-red-400">
                                                            Server Offline
                                                        </span>
                                                        <button
                                                            onClick={checkServerStatus}
                                                            className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            title="Refresh server status"
                                                        >
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    YouTube Playlist URL
                                                </label>
                                                <div className="relative">
                                                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="url"
                                                        value={playlistUrl}
                                                        onChange={(e) => setPlaylistUrl(e.target.value)}
                                                        placeholder="https://www.youtube.com/playlist?list=..."
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                        disabled={isImporting}
                                                    />
                                                </div>
                                            </div>

                                            {fetchProgress && (
                                                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                                                    <span className="text-sm text-blue-700 dark:text-blue-400">
                                                        {fetchProgress}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                    How to get a YouTube playlist URL:
                                                </h4>
                                                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                    <li>1. Go to YouTube and find the playlist you want to import</li>
                                                    <li>2. Click on the playlist to open it</li>
                                                    <li>3. Copy the URL from your browser's address bar</li>
                                                    <li>4. Paste it above and click "Fetch Playlist"</li>
                                                </ol>
                                                <div className="mt-3">
                                                    <strong>Example URL:</strong> https://www.youtube.com/playlist?list=PLrxfgDEc2NxY_fRjEJVHntkVhGP_Di6G
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <strong>Note:</strong> Only public and unlisted playlists can be imported.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between mt-6">
                                            <button
                                                onClick={onClose}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleFetchPlaylist}
                                                disabled={isImporting || !playlistUrl.trim() || serverStatus?.status === 'ERROR'}
                                                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isImporting ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        <span>Fetching...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="w-4 h-4" />
                                                        <span>Fetch Playlist</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && playlistInfo && (
                                    <div>
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Course Details
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Configure the course information before importing
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Course Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={courseTitle}
                                                    onChange={(e) => setCourseTitle(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Instructor
                                                </label>
                                                <input
                                                    type="text"
                                                    value={instructor}
                                                    onChange={(e) => setInstructor(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Category
                                                </label>
                                                {!showNewCategoryInput ? (
                                                    <div className="space-y-2">
                                                        <select
                                                            value={selectedCategory}
                                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                        >
                                                            <option value="">Select a category</option>
                                                            {categories.filter(cat => cat !== 'All').map(category => (
                                                                <option key={category} value={category}>{category}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => setShowNewCategoryInput(true)}
                                                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                                        >
                                                            + Create new category
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={newCategory}
                                                            onChange={(e) => setNewCategory(e.target.value)}
                                                            placeholder="Enter new category name"
                                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                setShowNewCategoryInput(false)
                                                                setNewCategory('')
                                                            }}
                                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                        >
                                                            Use existing category
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-6">
                                            <div className="flex items-start space-x-3">
                                                <Youtube className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        {playlistInfo.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                        {playlistInfo.description?.substring(0, 150)}...
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>{fetchedVideos.length} videos</span>
                                                        <span>•</span>
                                                        <span>Channel: {playlistInfo.channelTitle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between mt-6">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => setStep(3)}
                                                disabled={!courseTitle || !instructor || (!selectedCategory && !newCategory)}
                                                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                Preview Import
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div>
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Import Preview
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                <strong>Ready to import:</strong> This will import real YouTube playlist data including
                                                actual video titles, descriptions, durations, and channel information from the YouTube Data API.
                                            </p>
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <h4 className="font-medium text-green-800 dark:text-green-200">
                                                    {courseTitle}
                                                </h4>
                                            </div>
                                            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                                <p><strong>Instructor:</strong> {instructor}</p>
                                                <p><strong>Category:</strong> {newCategory || selectedCategory}</p>
                                                <p><strong>Videos:</strong> {fetchedVideos.length} videos</p>
                                                <p><strong>Source:</strong> YouTube Playlist</p>
                                            </div>
                                        </div>

                                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                                            {fetchedVideos.slice(0, 5).map((video, index) => (
                                                <div key={index} className="p-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="w-8 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">{index + 1}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {video.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {video.duration} • {video.channelTitle}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {fetchedVideos.length > 5 && (
                                                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    ... and {fetchedVideos.length - 5} more videos
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between mt-6">
                                            <button
                                                onClick={() => setStep(2)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={handleImportYouTubePlaylist}
                                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>Import {fetchedVideos.length} Videos</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                {/* Happy Editting Course Import Content */}
                                <div className="text-center">
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isAlreadyImported
                                        ? 'bg-green-100 dark:bg-green-900/20'
                                        : 'bg-purple-100 dark:bg-purple-900/20'
                                        }`}>
                                        {isAlreadyImported ? (
                                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <Download className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Happy Editting Course
                                    </h3>

                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        {isAlreadyImported ? (
                                            showDuplicateWarning ? (
                                                <>Course is already imported! This will create duplicates. Are you sure you want to continue?</>
                                            ) : (
                                                <>✅ Course is already imported with {videos.filter(v => v.instructor === 'Happy Editting' && v.category === 'Video Editing').length} videos. Your progress is saved!</>
                                            )
                                        ) : (
                                            <>Import the complete "Happy Editting" video editing course with comprehensive lessons covering all aspects of professional video editing.</>
                                        )}
                                    </p>

                                    {(!isAlreadyImported || showDuplicateWarning) && (
                                        <div className="text-left text-sm text-gray-700 dark:text-gray-300 mb-6 space-y-1">
                                            <div>• Pro Mindset & Creative Thinking</div>
                                            <div>• Project Breakdowns & Analysis</div>
                                            <div>• Professional Workflows</div>
                                            <div>• Creative Tools & Techniques</div>
                                            <div>• After Effects Mastery</div>
                                            <div>• Business & Client Relations</div>
                                        </div>
                                    )}

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {isAlreadyImported && !showDuplicateWarning ? 'Close' : 'Cancel'}
                                        </button>

                                        {showDuplicateWarning ? (
                                            <button
                                                onClick={handleImportHappyEdittingCourse}
                                                disabled={isImporting}
                                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                {isImporting ? 'Importing...' : 'Force Import'}
                                            </button>
                                        ) : !isAlreadyImported ? (
                                            <button
                                                onClick={handleImportHappyEdittingCourse}
                                                disabled={isImporting}
                                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                {isImporting ? 'Importing...' : 'Import Course'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleImportHappyEdittingCourse}
                                                disabled={isImporting}
                                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                {isImporting ? 'Checking...' : 'Check for Updates'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Success Display */}
                        {importStatus && !error && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-green-700 dark:text-green-400">{importStatus}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CourseImporter 