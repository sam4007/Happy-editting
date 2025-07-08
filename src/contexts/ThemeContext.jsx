import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }) => {
    // Initialize state with saved preference or system preference
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            return savedTheme === 'dark'
        }

        // Fallback to system preference
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }

        // Default to light mode
        return false
    })

    // Apply theme to document on mount and whenever darkMode changes
    useEffect(() => {
        const root = window.document.documentElement
        if (darkMode) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        // Save preference to localStorage
        localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    }, [darkMode])

    const toggleTheme = () => {
        setDarkMode(prev => !prev)
    }

    const value = {
        darkMode,
        toggleTheme
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
} 