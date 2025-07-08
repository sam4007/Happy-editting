import React, { useState } from 'react'
import { useVideo } from '../contexts/VideoContext'
import { Plus, Edit2, Trash2, X, Check, Tag, AlertCircle } from 'lucide-react'

const CategoryManager = ({ isOpen, onClose }) => {
    const { categories, addCategory, editCategory, deleteCategory } = useVideo()
    const [newCategoryName, setNewCategoryName] = useState('')
    const [editingCategory, setEditingCategory] = useState(null)
    const [editingName, setEditingName] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    if (!isOpen) return null

    const handleAddCategory = () => {
        setError('')
        setSuccess('')

        if (!newCategoryName.trim()) {
            setError('Category name cannot be empty')
            return
        }

        if (categories.includes(newCategoryName.trim())) {
            setError('Category already exists')
            return
        }

        const success = addCategory(newCategoryName.trim())
        if (success) {
            setSuccess('Category added successfully')
            setNewCategoryName('')
            setTimeout(() => setSuccess(''), 3000)
        } else {
            setError('Failed to add category')
        }
    }

    const startEditingCategory = (category) => {
        setEditingCategory(category)
        setEditingName(category)
        setError('')
        setSuccess('')
    }

    const handleEditCategory = () => {
        setError('')
        setSuccess('')

        if (!editingName.trim()) {
            setError('Category name cannot be empty')
            return
        }

        if (editingName.trim() === editingCategory) {
            cancelEditing()
            return
        }

        if (categories.includes(editingName.trim())) {
            setError('Category already exists')
            return
        }

        const success = editCategory(editingCategory, editingName.trim())
        if (success) {
            setSuccess('Category updated successfully')
            setEditingCategory(null)
            setEditingName('')
            setTimeout(() => setSuccess(''), 3000)
        } else {
            setError('Failed to update category')
        }
    }

    const handleDeleteCategory = (categoryName) => {
        setError('')
        setSuccess('')

        if (categoryName === 'All') {
            setError('Cannot delete the "All" category')
            return
        }

        if (window.confirm(`Are you sure you want to delete the "${categoryName}" category?\n\nAll videos in this category will be moved to "Programming".`)) {
            const success = deleteCategory(categoryName)
            if (success) {
                setSuccess('Category deleted successfully')
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError('Failed to delete category')
            }
        }
    }

    const cancelEditing = () => {
        setEditingCategory(null)
        setEditingName('')
        setError('')
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <Tag className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Manage Categories
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Add New Category */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Add New Category
                        </h3>
                        <div className="flex space-x-3">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Enter category name"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <button
                                onClick={handleAddCategory}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                <span className="text-red-700 dark:text-red-300">{error}</span>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center">
                                <Check className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-green-700 dark:text-green-300">{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Existing Categories */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Existing Categories ({categories.length})
                        </h3>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <div
                                    key={category}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Tag className="h-4 w-4 text-gray-500" />
                                        {editingCategory === category ? (
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                                                onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {category}
                                            </span>
                                        )}
                                        {category === 'All' && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {editingCategory === category ? (
                                            <>
                                                <button
                                                    onClick={handleEditCategory}
                                                    className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                                    title="Save changes"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {category !== 'All' && (
                                                    <>
                                                        <button
                                                            onClick={() => startEditingCategory(category)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                            title="Edit category"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category)}
                                                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Delete category"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                            💡 Tips for Managing Categories:
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            <li>• Use descriptive names for better organization</li>
                            <li>• The "All" category cannot be edited or deleted</li>
                            <li>• Deleting a category will move all videos to "Programming"</li>
                            <li>• Categories are automatically saved and synced</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CategoryManager 