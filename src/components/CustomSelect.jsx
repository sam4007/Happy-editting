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
                top: rect.bottom + window.scrollY + 4,
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
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                minWidth: '120px'
            }}
        >
            <div className="py-1">
                {options.map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOptionClick(option)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${option === value
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        {option}
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
                className="input-premium w-full text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <span className="block truncate">
                    {selectedOption || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
                        }`}
                />
            </button>

            {/* Render dropdown via portal */}
            {dropdownPortal}
        </div>
    )
}

export default CustomSelect 