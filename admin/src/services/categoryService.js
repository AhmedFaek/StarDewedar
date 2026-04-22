import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

/**
 * Get all categories
 */
export const getAllCategories = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/categories`, {
            method: 'GET',
        })
        return await handleApiResponse(response)
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
        const response = await apiClient(`${API_BASE_URL}/categories/${id}`, {
            method: 'GET',
        })
        return await handleApiResponse(response)
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
        const response = await apiClient(`${API_BASE_URL}/categories`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        return await handleApiResponse(response)
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
        const response = await apiClient(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
        return await handleApiResponse(response)
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
        const response = await apiClient(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
        })
        return await handleApiResponse(response)
    } catch (error) {
        console.error('Error deleting category:', error)
        throw error
    }
}
