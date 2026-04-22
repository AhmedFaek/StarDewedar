/**
 * Decode JWT token from localStorage
 * @returns {object} Decoded token data or null
 */
export const getDecodedToken = () => {
    const token = localStorage.getItem('accessToken')

    if (!token) return null

    try {
        // JWT format: header.payload.signature
        const parts = token.split('.')
        if (parts.length !== 3) return null

        // Decode the payload (second part)
        const decoded = JSON.parse(atob(parts[1]))
        console.log('Decoded token:', decoded) // Debug log
        return decoded
    } catch (error) {
        console.error('Failed to decode token:', error)
        return null
    }
}

/**
 * Get current logged-in user info
 * @returns {object} User data with userId, role, name
 */
export const getCurrentUser = () => {
    return getDecodedToken()
}
