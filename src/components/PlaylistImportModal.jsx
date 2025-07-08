import React, { useState } from 'react'
import { useVideo } from '../contexts/VideoContext'
import YouTubePlaylistImporter from './YouTubePlaylistImporter'

const PlaylistImportModal = ({ isOpen, onClose }) => {
    const { categories, importYouTubePlaylist, addCategory } = useVideo()

    if (!isOpen) return null

    const handleImport = (playlistData) => {
        importYouTubePlaylist(playlistData)
        onClose()
    }

    return (
        <YouTubePlaylistImporter
            onImport={handleImport}
            onClose={onClose}
            categories={categories.filter(cat => cat !== 'All')} // Remove 'All' from category options
            addCategory={addCategory}
        />
    )
}

export default PlaylistImportModal 