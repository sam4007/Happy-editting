import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useFriends } from '../contexts/FriendsContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    writeBatch
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Send, User, ArrowLeft, Smile, MessageCircle, Palette, Upload, X, Crop, Check, Scissors, RotateCcw, RotateCw, RefreshCw, Maximize, Move, Plus, Minus } from 'lucide-react'

const Messages = () => {
    const { friendId } = useParams()
    const { user } = useAuth()
    const { friends } = useFriends()
    const { darkMode } = useTheme()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false) // Start with false for faster initial render
    const [friendData, setFriendData] = useState(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showThemePicker, setShowThemePicker] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState('default')
    const [customWallpaper, setCustomWallpaper] = useState(() => {
        // Load wallpaper from localStorage on component mount
        const saved = localStorage.getItem(`wallpaper_${friendId}`)
        return saved ? JSON.parse(saved) : null
    })
    const [customColors, setCustomColors] = useState(() => {
        // Load colors from localStorage on component mount
        const saved = localStorage.getItem(`colors_${friendId}`)
        return saved ? JSON.parse(saved) : {
            sentMessage: '#3B82F6',
            receivedMessage: '#F3F4F6',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
    })

    // Wrapper functions to save to localStorage when state changes
    const saveWallpaper = (wallpaper) => {
        setCustomWallpaper(wallpaper)
        if (wallpaper) {
            localStorage.setItem(`wallpaper_${friendId}`, JSON.stringify(wallpaper))
        } else {
            localStorage.removeItem(`wallpaper_${friendId}`)
        }
    }

    const saveColors = (colors) => {
        setCustomColors(colors)
        localStorage.setItem(`colors_${friendId}`, JSON.stringify(colors))
    }

    // Advanced crop functions
    const addToHistory = (newCropArea) => {
        const newHistory = cropHistory.slice(0, historyIndex + 1)
        newHistory.push(newCropArea)
        setCropHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
    }

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            setCropArea(cropHistory[newIndex])
        }
    }

    const redo = () => {
        if (historyIndex < cropHistory.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            setCropArea(cropHistory[newIndex])
        }
    }

    const resetCrop = () => {
        if (cropImageRef.current) {
            const image = cropImageRef.current
            const imageWidth = image.naturalWidth
            const imageHeight = image.naturalHeight

            const cropWidth = Math.min(imageWidth * 0.8, 1000)
            const cropHeight = Math.min(imageHeight * 0.8, 800)

            const cropX = (imageWidth - cropWidth) / 2
            const cropY = (imageHeight - cropHeight) / 2

            const newCropArea = {
                x: cropX,
                y: cropY,
                width: cropWidth,
                height: cropHeight,
                imageWidth,
                imageHeight
            }

            setCropArea(newCropArea)
            addToHistory(newCropArea)
        }
    }

    const fitToScreen = () => {
        if (cropImageRef.current && cropContainerRef.current) {
            const image = cropImageRef.current
            const container = cropContainerRef.current
            const imageWidth = image.naturalWidth
            const imageHeight = image.naturalHeight

            const containerRect = container.getBoundingClientRect()
            const scaleX = containerRect.width / imageWidth
            const scaleY = containerRect.height / imageHeight
            const scale = Math.min(scaleX, scaleY, 1)

            setImageScale(scale)
            setZoomLevel(scale)
        }
    }

    const centerCrop = () => {
        if (cropImageRef.current) {
            const image = cropImageRef.current
            const imageWidth = image.naturalWidth
            const imageHeight = image.naturalHeight

            const newCropArea = {
                ...cropArea,
                x: (imageWidth - cropArea.width) / 2,
                y: (imageHeight - cropArea.height) / 2
            }

            setCropArea(newCropArea)
            addToHistory(newCropArea)
        }
    }
    const [showCropModal, setShowCropModal] = useState(false)
    const [cropImage, setCropImage] = useState(null)
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0, imageWidth: 0, imageHeight: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeHandle, setResizeHandle] = useState(null) // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [aspectRatio, setAspectRatio] = useState('free')
    const [zoomLevel, setZoomLevel] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [cropMode, setCropMode] = useState('select') // 'select', 'move', 'resize'
    const [showGrid, setShowGrid] = useState(true)
    const [showGuides, setShowGuides] = useState(true)
    const [imageScale, setImageScale] = useState(1)
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
    const [isImageDragging, setIsImageDragging] = useState(false)
    const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 })
    const [cropHistory, setCropHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const messagesEndRef = useRef(null)
    const emojiPickerRef = useRef(null)
    const themePickerRef = useRef(null)
    const fileInputRef = useRef(null)
    const cropFileInputRef = useRef(null)
    const cropContainerRef = useRef(null)
    const cropImageRef = useRef(null)

    // Optimize friend finding - use memoization and early return
    const friend = React.useMemo(() => {
        if (!friends || friends.length === 0) return null
        return friends.find(f => f.id === friendId)
    }, [friends, friendId])

    // Set friend data immediately when found
    React.useEffect(() => {
        if (friend) {
            setFriendData(friend)
        }
    }, [friend])

    // Reload wallpaper and colors when friendId changes
    React.useEffect(() => {
        // Load wallpaper from localStorage for this specific friend
        const savedWallpaper = localStorage.getItem(`wallpaper_${friendId}`)
        if (savedWallpaper) {
            setCustomWallpaper(JSON.parse(savedWallpaper))
        } else {
            setCustomWallpaper(null)
        }

        // Load colors from localStorage for this specific friend
        const savedColors = localStorage.getItem(`colors_${friendId}`)
        if (savedColors) {
            setCustomColors(JSON.parse(savedColors))
        } else {
            setCustomColors({
                sentMessage: '#3B82F6',
                receivedMessage: '#F3F4F6',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            })
        }
    }, [friendId])

    // Default theme that adapts to light/dark mode
    const defaultTheme = {
        name: 'Default',
        sentMessage: '#3B82F6',
        receivedMessage: '#F3F4F6',
        background: darkMode ? '#000000' : '#ffffff',
        darkBackground: '#000000'
    }

    // Common emojis for the picker
    const commonEmojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
        '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
        '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
        '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
        '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
        '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
        '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
        '👍', '👎', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
        '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙',
        '💪', '🖕', '✍️', '🙏', '🦶', '🦵', '💄', '💋', '👄', '🦷',
        '👅', '👂', '🦻', '👃', '👣', '👁', '👀', '🧠', '🗣', '👤',
        '👥', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✨', '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍭',
        '🍬', '🍫', '🍿', '🍩', '🍪', '🎵', '🎶', '🎼', '🎤', '🎧',
        '📱', '💻', '⌨️', '🖥', '🖨', '📞', '📟', '📠', '📺', '📻'
    ]

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Close emoji picker and theme picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false)
            }
            if (themePickerRef.current && !themePickerRef.current.contains(event.target)) {
                setShowThemePicker(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Global mouse event listeners for cropping
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (isDragging) {
                handleMouseMove(e)
            }
        }

        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleMouseUp()
            }
        }

        if (showCropModal) {
            document.addEventListener('mousemove', handleGlobalMouseMove)
            document.addEventListener('mouseup', handleGlobalMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
        }
    }, [isDragging, showCropModal])

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji)
        setShowEmojiPicker(false)
    }

    // Handle theme selection (now only default theme)
    const handleThemeSelect = () => {
        setSelectedTheme('default')
        setShowThemePicker(false)
    }

    // Handle custom wallpaper upload
    const handleWallpaperUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setCropImage(e.target.result)
                setShowCropModal(true)
            }
            reader.onerror = (error) => {
                console.error('Error reading file:', error)
            }
            reader.readAsDataURL(file)
        }
    }

    // Initialize crop area when image loads
    const handleImageLoad = () => {
        if (cropImageRef.current && cropContainerRef.current) {
            const image = cropImageRef.current

            // Get the actual image dimensions
            const imageWidth = image.naturalWidth
            const imageHeight = image.naturalHeight

            // Start with a smaller crop area for better precision
            const cropWidth = Math.min(imageWidth * 0.6, 800)
            const cropHeight = Math.min(imageHeight * 0.6, 600)

            const cropX = (imageWidth - cropWidth) / 2
            const cropY = (imageHeight - cropHeight) / 2

            const initialCropArea = {
                x: cropX,
                y: cropY,
                width: cropWidth,
                height: cropHeight,
                imageWidth,
                imageHeight
            }

            setCropArea(initialCropArea)
            setCropHistory([initialCropArea])
            setHistoryIndex(0)
            fitToScreen()
        }
    }

    // Handle crop area interaction
    const handleMouseDown = (e) => {
        e.preventDefault()

        if (cropImageRef.current) {
            const imageRect = cropImageRef.current.getBoundingClientRect()
            const mouseX = e.clientX - imageRect.left
            const mouseY = e.clientY - imageRect.top

            // Convert display coordinates to image coordinates
            const scaleX = cropArea.imageWidth / imageRect.width
            const scaleY = cropArea.imageHeight / imageRect.height
            const imageX = mouseX * scaleX
            const imageY = mouseY * scaleY

            // Check if clicking inside crop area
            const isInsideCrop = imageX >= cropArea.x && imageX <= cropArea.x + cropArea.width &&
                imageY >= cropArea.y && imageY <= cropArea.y + cropArea.height

            // Check if clicking on resize handles
            const handleSize = 15
            const handleScaleX = handleSize * scaleX
            const handleScaleY = handleSize * scaleY

            if (isInsideCrop && !isResizing) {
                // Moving the crop area
                setIsDragging(true)
                setCropMode('move')
            } else if (imageX >= cropArea.x - handleScaleX && imageX <= cropArea.x + handleScaleX &&
                imageY >= cropArea.y - handleScaleY && imageY <= cropArea.y + handleScaleY) {
                // Top-left handle
                setIsResizing(true)
                setResizeHandle('nw')
            } else if (imageX >= cropArea.x + cropArea.width - handleScaleX && imageX <= cropArea.x + cropArea.width + handleScaleX &&
                imageY >= cropArea.y - handleScaleY && imageY <= cropArea.y + handleScaleY) {
                // Top-right handle
                setIsResizing(true)
                setResizeHandle('ne')
            } else if (imageX >= cropArea.x - handleScaleX && imageX <= cropArea.x + handleScaleX &&
                imageY >= cropArea.y + cropArea.height - handleScaleY && imageY <= cropArea.y + cropArea.height + handleScaleY) {
                // Bottom-left handle
                setIsResizing(true)
                setResizeHandle('sw')
            } else if (imageX >= cropArea.x + cropArea.width - handleScaleX && imageX <= cropArea.x + cropArea.width + handleScaleX &&
                imageY >= cropArea.y + cropArea.height - handleScaleY && imageY <= cropArea.y + cropArea.height + handleScaleY) {
                // Bottom-right handle
                setIsResizing(true)
                setResizeHandle('se')
            } else if (imageX >= cropArea.x + cropArea.width / 2 - handleScaleX && imageX <= cropArea.x + cropArea.width / 2 + handleScaleX &&
                imageY >= cropArea.y - handleScaleY && imageY <= cropArea.y + handleScaleY) {
                // Top handle
                setIsResizing(true)
                setResizeHandle('n')
            } else if (imageX >= cropArea.x + cropArea.width / 2 - handleScaleX && imageX <= cropArea.x + cropArea.width / 2 + handleScaleX &&
                imageY >= cropArea.y + cropArea.height - handleScaleY && imageY <= cropArea.y + cropArea.height + handleScaleY) {
                // Bottom handle
                setIsResizing(true)
                setResizeHandle('s')
            } else if (imageX >= cropArea.x - handleScaleX && imageX <= cropArea.x + handleScaleX &&
                imageY >= cropArea.y + cropArea.height / 2 - handleScaleY && imageY <= cropArea.y + cropArea.height / 2 + handleScaleY) {
                // Left handle
                setIsResizing(true)
                setResizeHandle('w')
            } else if (imageX >= cropArea.x + cropArea.width - handleScaleX && imageX <= cropArea.x + cropArea.width + handleScaleX &&
                imageY >= cropArea.y + cropArea.height / 2 - handleScaleY && imageY <= cropArea.y + cropArea.height / 2 + handleScaleY) {
                // Right handle
                setIsResizing(true)
                setResizeHandle('e')
            } else {
                // Creating a new crop area or dragging image
                if (e.ctrlKey || e.metaKey) {
                    // Dragging image
                    setIsImageDragging(true)
                    setImageDragStart({ x: e.clientX, y: e.clientY })
                } else {
                    // Creating new crop area
                    setIsDragging(true)
                    setCropMode('select')
                    setCropArea(prev => ({
                        ...prev,
                        x: imageX,
                        y: imageY,
                        width: 0,
                        height: 0
                    }))
                }
            }

            setDragStart({
                x: imageX,
                y: imageY
            })
        }
    }

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing && !isImageDragging) return

        e.preventDefault()

        if (cropImageRef.current) {
            const imageRect = cropImageRef.current.getBoundingClientRect()
            const mouseX = e.clientX - imageRect.left
            const mouseY = e.clientY - imageRect.top

            // Convert display coordinates to image coordinates
            const scaleX = cropArea.imageWidth / imageRect.width
            const scaleY = cropArea.imageHeight / imageRect.height
            const newImageX = mouseX * scaleX
            const newImageY = mouseY * scaleY

            if (isImageDragging) {
                // Dragging the image
                const deltaX = e.clientX - imageDragStart.x
                const deltaY = e.clientY - imageDragStart.y

                setImageOffset(prev => ({
                    x: prev.x + deltaX,
                    y: prev.y + deltaY
                }))
                setImageDragStart({ x: e.clientX, y: e.clientY })
            } else if (cropMode === 'move') {
                // Moving the crop area
                const maxX = cropArea.imageWidth - cropArea.width
                const maxY = cropArea.imageHeight - cropArea.height

                const newCropArea = {
                    ...cropArea,
                    x: Math.max(0, Math.min(newImageX - dragStart.x + cropArea.x, maxX)),
                    y: Math.max(0, Math.min(newImageY - dragStart.y + cropArea.y, maxY))
                }

                setCropArea(newCropArea)
            } else if (cropMode === 'select') {
                // Creating/selecting crop area
                const minSize = 20 // Minimum crop size
                const width = Math.abs(newImageX - dragStart.x)
                const height = Math.abs(newImageY - dragStart.y)

                if (width >= minSize && height >= minSize) {
                    const x = Math.min(dragStart.x, newImageX)
                    const y = Math.min(dragStart.y, newImageY)

                    // Ensure crop area stays within image bounds
                    const boundedX = Math.max(0, Math.min(x, cropArea.imageWidth - width))
                    const boundedY = Math.max(0, Math.min(y, cropArea.imageHeight - height))
                    const boundedWidth = Math.min(width, cropArea.imageWidth - boundedX)
                    const boundedHeight = Math.min(height, cropArea.imageHeight - boundedY)

                    const newCropArea = {
                        ...cropArea,
                        x: boundedX,
                        y: boundedY,
                        width: boundedWidth,
                        height: boundedHeight
                    }

                    setCropArea(newCropArea)
                }
            } else if (isResizing) {
                // Resizing the crop area
                const minSize = 50
                let newWidth = cropArea.width
                let newHeight = cropArea.height
                let newX = cropArea.x
                let newY = cropArea.y

                switch (resizeHandle) {
                    case 'nw':
                        newWidth = cropArea.x + cropArea.width - newImageX
                        newHeight = cropArea.y + cropArea.height - newImageY
                        newX = newImageX
                        newY = newImageY
                        break
                    case 'ne':
                        newWidth = newImageX - cropArea.x
                        newHeight = cropArea.y + cropArea.height - newImageY
                        newY = newImageY
                        break
                    case 'sw':
                        newWidth = cropArea.x + cropArea.width - newImageX
                        newHeight = newImageY - cropArea.y
                        newX = newImageX
                        break
                    case 'se':
                        newWidth = newImageX - cropArea.x
                        newHeight = newImageY - cropArea.y
                        break
                    case 'n':
                        newHeight = cropArea.y + cropArea.height - newImageY
                        newY = newImageY
                        break
                    case 's':
                        newHeight = newImageY - cropArea.y
                        break
                    case 'w':
                        newWidth = cropArea.x + cropArea.width - newImageX
                        newX = newImageX
                        break
                    case 'e':
                        newWidth = newImageX - cropArea.x
                        break
                }

                // Apply minimum size constraints
                if (newWidth >= minSize && newHeight >= minSize) {
                    // Apply aspect ratio if locked
                    if (aspectRatio !== 'free') {
                        const aspectRatioValue = aspectRatio === '16:9' ? 16 / 9 : 4 / 3
                        if (newWidth / newHeight > aspectRatioValue) {
                            newHeight = newWidth / aspectRatioValue
                        } else {
                            newWidth = newHeight * aspectRatioValue
                        }
                    }

                    // Ensure crop area stays within image bounds
                    if (newX >= 0 && newY >= 0 &&
                        newX + newWidth <= cropArea.imageWidth &&
                        newY + newHeight <= cropArea.imageHeight) {

                        const newCropArea = {
                            ...cropArea,
                            x: newX,
                            y: newY,
                            width: newWidth,
                            height: newHeight
                        }

                        setCropArea(newCropArea)
                    }
                }
            }
        }
    }

    const handleMouseUp = () => {
        if (isDragging || isResizing) {
            addToHistory(cropArea)
        }

        setIsDragging(false)
        setIsResizing(false)
        setIsImageDragging(false)
        setResizeHandle(null)
        setCropMode('select')
    }

    // Apply crop and set wallpaper
    const applyCrop = () => {
        if (cropImageRef.current) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const image = cropImageRef.current

            // Set canvas size to crop dimensions
            canvas.width = cropArea.width
            canvas.height = cropArea.height

            // Save the current context
            ctx.save()

            // Apply rotation if needed
            if (rotation !== 0) {
                ctx.translate(canvas.width / 2, canvas.height / 2)
                ctx.rotate((rotation * Math.PI) / 180)
                ctx.translate(-canvas.width / 2, -canvas.height / 2)
            }

            // Draw cropped portion using image coordinates
            ctx.drawImage(
                image,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, cropArea.width, cropArea.height
            )

            // Restore the context
            ctx.restore()

            // Convert to data URL and set as wallpaper
            const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
            saveWallpaper(croppedImage)
            setSelectedTheme('custom')
            setShowCropModal(false)
            setCropImage(null)
            setCropArea({ x: 0, y: 0, width: 0, height: 0, imageWidth: 0, imageHeight: 0 })
            setAspectRatio('16:9')
            setZoomLevel(1)
            setRotation(0)
        }
    }

    // Cancel crop
    const cancelCrop = () => {
        setShowCropModal(false)
        setCropImage(null)
        setCropArea({ x: 0, y: 0, width: 0, height: 0, imageWidth: 0, imageHeight: 0 })
        setIsDragging(false)
        setIsResizing(false)
        setIsImageDragging(false)
        setResizeHandle(null)
        setCropMode('select')
        setAspectRatio('free')
        setZoomLevel(1)
        setRotation(0)
        setShowGrid(true)
        setShowGuides(true)
        setImageScale(1)
        setImageOffset({ x: 0, y: 0 })
        setCropHistory([])
        setHistoryIndex(-1)
    }

    // Handle aspect ratio change
    const handleAspectRatioChange = (ratio) => {
        setAspectRatio(ratio)
        // For now, just change the ratio without affecting current crop
        // Users can manually adjust the crop area as needed
    }

    // Handle zoom change
    const handleZoomChange = (newZoom) => {
        const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
        setZoomLevel(clampedZoom)
    }

    // Handle rotation
    const handleRotation = () => {
        const newRotation = (rotation + 90) % 360
        setRotation(newRotation)
    }

    // Handle custom color changes
    const handleCustomColorChange = (type, value) => {
        const newColors = {
            ...customColors,
            [type]: value
        }
        saveColors(newColors)
        setSelectedTheme('custom')
    }

    // Get current theme colors
    const getCurrentTheme = () => {
        if (customWallpaper) {
            return {
                background: `url(${customWallpaper}) center/cover fixed`,
                sentMessage: customColors.sentMessage,
                receivedMessage: customColors.receivedMessage
            }
        }
        return defaultTheme
    }

    // Mark messages as seen when user opens the chat
    const markMessagesAsSeen = async (messagesList) => {
        if (!user || !friendId || !messagesList.length) return

        try {
            const batch = writeBatch(db)

            // Mark messages that were sent TO the current user as seen
            const unseenMessages = messagesList.filter(msg =>
                msg.senderId !== user.uid && msg.status === 'sent'
            )

            unseenMessages.forEach(msg => {
                const messageRef = doc(db, 'messages', msg.id)
                batch.update(messageRef, {
                    status: 'seen',
                    seenAt: serverTimestamp()
                })
            })

            if (unseenMessages.length > 0) {
                await batch.commit()
            }
        } catch (error) {
            console.error('Error marking messages as seen:', error)
        }
    }

    useEffect(() => {
        if (!user || !friendId) return

        const chatId = [user.uid, friendId].sort().join('_')

        // Query messages and listen for real-time updates
        const messagesQuery = query(
            collection(db, 'messages'),
            where('chatId', '==', chatId)
        )

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesList = []
            snapshot.forEach((doc) => {
                const docData = { id: doc.id, ...doc.data() }
                messagesList.push(docData)
            })

            // Sort on client side by timestamp
            messagesList.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0
                return a.timestamp.toMillis() - b.timestamp.toMillis()
            })

            setMessages(messagesList)
            setLoading(false)

            // Mark messages as seen when they're loaded (only once when opening chat)
            markMessagesAsSeen(messagesList)
        })

        return () => unsubscribe()
    }, [user, friendId])

    // Additional effect to mark messages as seen when the component mounts
    useEffect(() => {
        if (!user || !friendId || messages.length === 0) return

        // Mark messages as seen when chat is opened
        markMessagesAsSeen(messages)
    }, [user, friendId]) // Only run when user or friendId changes (chat opens)

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !user || !friendId) return

        const chatId = [user.uid, friendId].sort().join('_')

        try {
            await addDoc(collection(db, 'messages'), {
                chatId,
                senderId: user.uid,
                senderName: user.displayName,
                receiverId: friendId,
                message: newMessage.trim(),
                timestamp: serverTimestamp(),
                status: 'sent', // Initial status is 'sent'
                seenAt: null
            })

            setNewMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp.toDate()
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()

        if (isToday) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            })
        }
    }

    const getMessageStatus = (message) => {
        // Only show status for messages sent by current user
        if (message.senderId !== user.uid) return null

        return message.status === 'seen' ? 'Seen' : 'Sent'
    }

    // Helper function to format date separators
    const formatDateSeparator = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp.toDate()
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === now.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
    }

    // Helper function to check if two dates are on different days
    const isDifferentDay = (timestamp1, timestamp2) => {
        if (!timestamp1 || !timestamp2) return false
        return timestamp1.toDate().toDateString() !== timestamp2.toDate().toDateString()
    }

    // Group messages with date separators
    const getMessagesWithDateSeparators = (messages) => {
        const messagesWithSeparators = []

        messages.forEach((message, index) => {
            const previousMessage = messages[index - 1]

            // Add date separator if this is the first message or if it's a different day
            if (index === 0 || isDifferentDay(previousMessage.timestamp, message.timestamp)) {
                messagesWithSeparators.push({
                    type: 'date-separator',
                    id: `date-${message.id}`,
                    timestamp: message.timestamp
                })
            }

            messagesWithSeparators.push({
                type: 'message',
                ...message
            })
        })

        return messagesWithSeparators
    }

    // Show loading only if friends are still loading and we don't have friend data yet
    if (!friendData && (!friends || friends.length === 0)) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                {/* Modern Minimal Loading */}
                <div className="flex flex-col items-center space-y-8">
                    {/* Clean Spinner */}
                    <div className="relative">
                        <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>

                    {/* Simple Text */}
                    <div className="text-center">
                        <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">Loading conversation...</h3>
                    </div>
                </div>
            </div>
        )
    }

    // Show error if friends loaded but friend not found
    if (friends && friends.length > 0 && !friendData) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Friend not found or not in your friends list.</p>
                    <button
                        onClick={() => window.location.href = '/friends'}
                        className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Friends</span>
                    </button>
                </div>
            </div>
        )
    }

    const currentTheme = getCurrentTheme()
    const backgroundStyle = customWallpaper
        ? {
            backgroundImage: `url(${customWallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }
        : { background: currentTheme.background }

    return (
        <div className="h-screen flex flex-col" style={backgroundStyle}>
            {/* Header - Premium and Minimal - Fixed to Viewport Top */}
            <div className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 fixed top-14 left-0 right-0 lg:left-64 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.location.href = '/friends'}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="relative">
                            {friendData.photoURL ? (
                                <img
                                    src={friendData.photoURL}
                                    alt={friendData.displayName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {friendData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{friendData.displayName}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Online</p>
                        </div>
                    </div>

                    {/* Theme Button with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowThemePicker(!showThemePicker)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Theme Picker Dropdown */}
                        {showThemePicker && (
                            <div
                                ref={themePickerRef}
                                className="absolute top-full right-0 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl p-6 w-80 z-50"
                            >
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chat Theme</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your chat appearance</p>
                                    </div>

                                    {/* Theme Customization */}
                                    <div className="space-y-5">
                                        {/* Custom Wallpaper */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallpaper</label>
                                            </div>
                                            <div className="flex space-x-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleWallpaperUpload}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    <span>Upload Image</span>
                                                </button>
                                                {customWallpaper && (
                                                    <button
                                                        onClick={() => saveWallpaper(null)}
                                                        className="px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Custom Colors */}
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message Colors</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-xs text-gray-500 dark:text-gray-400">Sent Message</label>
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-lg"
                                                            style={{ backgroundColor: customColors.sentMessage }}
                                                        ></div>
                                                        <input
                                                            type="color"
                                                            value={customColors.sentMessage}
                                                            onChange={(e) => handleCustomColorChange('sentMessage', e.target.value)}
                                                            className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-xs text-gray-500 dark:text-gray-400">Received Message</label>
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-lg"
                                                            style={{ backgroundColor: customColors.receivedMessage }}
                                                        ></div>
                                                        <input
                                                            type="color"
                                                            value={customColors.receivedMessage}
                                                            onChange={(e) => handleCustomColorChange('receivedMessage', e.target.value)}
                                                            className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area - Clean and Minimal */}
            <div className="flex-1 overflow-y-auto pt-16 pb-20">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400 rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4">
                        <div className="w-16 h-16 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center text-sm">Start a conversation with {friendData.displayName}</p>
                    </div>
                ) : (
                    <div className="px-4 space-y-3">
                        {getMessagesWithDateSeparators(messages).map((item) => {
                            if (item.type === 'date-separator') {
                                return (
                                    <div key={item.id} className="flex justify-center my-4">
                                        <div className="px-3 py-1 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full">
                                            <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                                                {formatDateSeparator(item.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={`flex ${item.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative shadow-sm"
                                        style={{
                                            backgroundColor: item.senderId === user.uid
                                                ? currentTheme.sentMessage
                                                : currentTheme.receivedMessage,
                                            color: item.senderId === user.uid ? 'white' : '#374151'
                                        }}
                                    >
                                        <p className="text-sm">{item.message}</p>
                                        <div
                                            className="text-xs mt-1 flex items-center justify-between"
                                            style={{
                                                color: item.senderId === user.uid
                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                    : 'rgba(55, 65, 81, 0.6)'
                                            }}
                                        >
                                            <span>{formatTime(item.timestamp)}</span>
                                            {getMessageStatus(item) && (
                                                <span className="ml-2 text-xs opacity-75">
                                                    {getMessageStatus(item)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input - Clean and Minimal - Fixed to Viewport Bottom */}
            <div className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 fixed bottom-0 left-0 right-0 lg:left-64 z-50">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-h-48 overflow-y-auto z-10"
                    >
                        <div className="grid grid-cols-8 gap-1">
                            {commonEmojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}



                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <Smile className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                    >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                    </button>
                </form>
            </div>

            {/* Premium Crop Modal */}
            {showCropModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-7xl w-full mx-4 max-h-[98vh] overflow-hidden border border-white/20 dark:border-gray-700/50">
                        {/* Premium Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Scissors className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Premium Crop Editor</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Professional image cropping with advanced tools
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={undo}
                                    disabled={historyIndex <= 0}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Undo (Ctrl+Z)"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={historyIndex >= cropHistory.length - 1}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Redo (Ctrl+Y)"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cancelCrop}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-red-500" />
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex h-[calc(98vh-200px)]">
                            {/* Image Area */}
                            <div className="flex-1 p-6">
                                <div
                                    ref={cropContainerRef}
                                    className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden border border-gray-300/50 dark:border-gray-600/50 h-full"
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    {cropImage && (
                                        <>
                                            <img
                                                ref={cropImageRef}
                                                src={cropImage}
                                                alt="Crop preview"
                                                className="w-full h-full object-contain"
                                                onLoad={handleImageLoad}
                                                draggable={false}
                                                style={{
                                                    transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${imageOffset.x}px, ${imageOffset.y}px)`,
                                                    transformOrigin: 'center'
                                                }}
                                            />

                                            {/* Dark overlay outside crop area */}
                                            <div className="absolute inset-0 bg-black/60">
                                                <div
                                                    className="absolute border-2 border-white shadow-2xl cursor-move select-none"
                                                    style={{
                                                        left: `${(cropArea.x / cropArea.imageWidth) * 100}%`,
                                                        top: `${(cropArea.y / cropArea.imageHeight) * 100}%`,
                                                        width: `${(cropArea.width / cropArea.imageWidth) * 100}%`,
                                                        height: `${(cropArea.height / cropArea.imageHeight) * 100}%`,
                                                        pointerEvents: 'auto',
                                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                                                    }}
                                                    onMouseDown={handleMouseDown}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseUp={handleMouseUp}
                                                >
                                                    {/* Resize handles */}
                                                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full border-2 border-blue-500 cursor-nw-resize hover:bg-blue-50 transition-colors"></div>
                                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full border-2 border-blue-500 cursor-ne-resize hover:bg-blue-50 transition-colors"></div>
                                                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full border-2 border-blue-500 cursor-sw-resize hover:bg-blue-50 transition-colors"></div>
                                                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full border-2 border-blue-500 cursor-se-resize hover:bg-blue-50 transition-colors"></div>

                                                    {/* Edge handles */}
                                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-n-resize"></div>
                                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-s-resize"></div>
                                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-w-resize"></div>
                                                    <div className="absolute right-1/2 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-e-resize"></div>

                                                    {/* Center guides */}
                                                    {showGuides && (
                                                        <>
                                                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/60 transform -translate-y-1/2"></div>
                                                            <div className="absolute left-1/2 top-0 w-px h-full bg-white/60 transform -translate-x-1/2"></div>
                                                        </>
                                                    )}

                                                    {/* Grid overlay */}
                                                    {showGrid && (
                                                        <div className="absolute inset-0 pointer-events-none">
                                                            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                                                                {Array.from({ length: 9 }).map((_, i) => (
                                                                    <div key={i} className="border border-white/20"></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info overlay */}
                                            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
                                                <div>Size: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}</div>
                                                <div>Position: {Math.round(cropArea.x)}, {Math.round(cropArea.y)}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Advanced Tools Panel */}
                            <div className="w-80 p-6 border-l border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30">
                                <div className="space-y-6">
                                    {/* Quick Actions */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={resetCrop}
                                                className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                <span>Reset</span>
                                            </button>
                                            <button
                                                onClick={fitToScreen}
                                                className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                                            >
                                                <Maximize className="w-4 h-4" />
                                                <span>Fit Screen</span>
                                            </button>
                                            <button
                                                onClick={centerCrop}
                                                className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                                            >
                                                <Move className="w-4 h-4" />
                                                <span>Center</span>
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span>New Image</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Aspect Ratio */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Aspect Ratio</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleAspectRatioChange('16:9')}
                                                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${aspectRatio === '16:9'
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                16:9
                                            </button>
                                            <button
                                                onClick={() => handleAspectRatioChange('4:3')}
                                                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${aspectRatio === '4:3'
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                4:3
                                            </button>
                                            <button
                                                onClick={() => handleAspectRatioChange('free')}
                                                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${aspectRatio === 'free'
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                Free
                                            </button>
                                        </div>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Zoom</label>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleZoomChange(zoomLevel - 0.1)}
                                                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-200"
                                                    style={{ width: `${((zoomLevel - 0.5) / 2.5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <button
                                                onClick={() => handleZoomChange(zoomLevel + 0.1)}
                                                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                            {Math.round(zoomLevel * 100)}%
                                        </div>
                                    </div>

                                    {/* Rotation Controls */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rotation</label>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={handleRotation}
                                                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-200"
                                                    style={{ width: `${((rotation % 360) / 360) * 100}%` }}
                                                ></div>
                                            </div>
                                            <button
                                                onClick={handleRotation}
                                                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                            {rotation}°
                                        </div>
                                    </div>

                                    {/* Display Options */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Display</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={showGrid}
                                                    onChange={(e) => setShowGrid(e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Show Grid</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={showGuides}
                                                    onChange={(e) => setShowGuides(e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Show Guides</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Keyboard Shortcuts */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Shortcuts</h4>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                            <div>• Ctrl + Drag: Move image</div>
                                            <div>• Drag handles: Resize crop</div>
                                            <div>• Drag inside: Move crop area</div>
                                            <div>• Drag outside: Create new crop</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Premium Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Tip:</span> Hold Ctrl/Cmd and drag to move the image around
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={cancelCrop}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={applyCrop}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Apply Crop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Messages 