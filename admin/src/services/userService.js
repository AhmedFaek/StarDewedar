import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

/**
 * Create a new user (admin-only)
 * POST /api/auth/create-user
 */
export const createUser = async (data) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/auth/create-user`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        return await handleApiResponse(response)
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}

/**
 * Get all users (admin-only)
 * GET /api/users
 */
export const getAllUsers = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/users`, {
            method: 'GET',
        })
        return await handleApiResponse(response)
    } catch (error) {
        console.error('Error fetching users:', error)
        throw error
    }
}

/**
 * Delete a user (admin-only)
 * DELETE /api/users/:id
 */
export const deleteUser = async (id) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
        })
        return await handleApiResponse(response)
    } catch (error) {
        console.error('Error deleting user:', error)
        throw error
    }
}
