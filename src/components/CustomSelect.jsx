import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

const CustomSelect = ({
    value,
    onChange,
    options = [],
    className = "",
    placeholder = "Select an option..."
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
    const selectRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                // Check if click is on a dropdown option (portal element)
                const isDropdownClick = event.target.closest('[data-dropdown-portal]')
                if (!isDropdownClick) {
                    setIsOpen(false)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && selectRef.current) {
            const rect = selectRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            })
        }
    }, [isOpen])

    const handleOptionClick = (optionValue) => {
        setIsOpen(false)
        // Trigger onChange with proper event structure
        onChange({ target: { value: optionValue } })
    }

    const toggleDropdown = () => {
        setIsOpen(!isOpen)
    }

    const selectedOption = options.find(option => option === value) || value

    // Dropdown options portal
    const dropdownPortal = isOpen && createPortal(
        <div
            data-dropdown-portal
            className="fixed z-[9999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl max-h-60 overflow-auto"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                minWidth: '140px'
            }}
        >
            <div className="py-2">
                {options.map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOptionClick(option)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 ${option === value
                            ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-r-2 border-indigo-500'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="truncate">{option}</span>
                            {option === value && (
                                <div className="w-2 h-2 bg-indigo-500 rounded-full ml-2 flex-shrink-0"></div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>,
        document.body
    )

    return (
        <div className={`relative ${className}`} ref={selectRef}>
            {/* Select Button */}
            <button
                type="button"
                onClick={toggleDropdown}
                className="w-full text-left flex items-center justify-between px-4 py-3 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 group"
            >
                <span className="block truncate font-medium">
                    {selectedOption || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-all duration-200 group-hover:text-indigo-500 ${isOpen ? 'transform rotate-180 text-indigo-500' : ''
                        }`}
                />
            </button>

            {/* Render dropdown via portal */}
            {dropdownPortal}
        </div>
    )
}

export default CustomSelect 