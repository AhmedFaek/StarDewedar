import { API_BASE_URL } from '../utils/constants'

/**
 * Get all categories
 */
export const getAllCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch categories')
        }

        return await response.json()
    } catch (error) {
        console.error('Error fetching categories:', error)
        throw error
    }
}

/**
 * Get single category by ID
 */
export const getCategoryById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch category')
        }

        return await response.json()
    } catch (error) {
        console.error('Error fetching category:', error)
        throw error
    }
}

/**
 * Create new category
 */
export const createCategory = async (data) => {
    try {
        const token = localStorage.getItem('accessToken')

        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to create category')
        }

        return await response.json()
    } catch (error) {
        console.error('Error creating category:', error)
        throw error
    }
}

/**
 * Update category
 */
export const updateCategory = async (id, data) => {
    try {
        const token = localStorage.getItem('accessToken')

        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to update category')
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating category:', error)
        throw error
    }
}

/**
 * Delete category
 */
export const deleteCategory = async (id) => {
    try {
        const token = localStorage.getItem('accessToken')

        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to delete category')
        }

        return await response.json()
    } catch (error) {
        console.error('Error deleting category:', error)
        throw error
    }
}
