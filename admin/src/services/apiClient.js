import { getValidAccessToken } from './tokenService'

/**
 * API client with automatic token refresh
 * Wraps fetch to handle 401 responses and token refresh
 */
export const apiClient = async (url, options = {}) => {
    try {
        // Get valid token (refreshes if needed)
        const token = await getValidAccessToken()

        // Add auth header if not already present
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        }

        const response = await fetch(url, {
            ...options,
            headers,
        })

        // Handle 401 Unauthorized
        if (response.status === 401) {
            // Token might have been invalidated, clear and redirect
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
            throw new Error('Session expired. Please login again.')
        }

        return response
    } catch (error) {
        console.error('API Client Error:', error)
        throw error
    }
}

/**
 * Helper to parse JSON from API response
 */
export const handleApiResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
    }
    return await response.json()
}
