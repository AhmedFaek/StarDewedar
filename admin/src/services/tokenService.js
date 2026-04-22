import { API_BASE_URL } from '../utils/constants'

let refreshPromise = null


/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
            window.location.href = '/login'
            throw new Error('No refresh token available')
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
            // ✅ Only clear tokens if the server explicitly rejects the refresh token
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'
            }
            throw new Error('Failed to refresh token')
        }

        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        return data.accessToken

    } catch (error) {
        console.error('Token refresh failed:', error)
        throw error
    }
}

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
    if (!token) return true

    try {
        const parts = token.split('.')
        if (parts.length !== 3) return true

        const decoded = JSON.parse(atob(parts[1]))
        const currentTime = Math.floor(Date.now() / 1000)

        // Refresh if token expires in less than 2 minutes
        return decoded.exp - currentTime < 120
    } catch {
        return true
    }
}

/**
 * Get valid access token (refresh if needed)
 */
export const getValidAccessToken = async () => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
        throw new Error('No access token available')
    }

    if (isTokenExpired(accessToken)) {
        // ✅ If a refresh is already in flight, wait for it instead of firing another
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null
            })
        }
        return await refreshPromise
    }

    return accessToken
}