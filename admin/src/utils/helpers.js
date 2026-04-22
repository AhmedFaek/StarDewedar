// Common utilities and helper functions

/**
 * Format currency to USD format
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date))
}

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

/**
 * Get status badge variant based on status string
 * @param {string} status - Status value
 * @returns {string} Badge variant name
 */
export const getStatusVariant = (status) => {
    const statusMap = {
        'active': 'success',
        'inactive': 'default',
        'pending': 'warning',
        'error': 'error',
        'urgent': 'urgent',
        'success': 'success',
        'warning': 'warning',
        'approved': 'success',
        'rejected': 'error',
        'under review': 'warning',
        'on-track': 'success',
        'at-risk': 'error',
        'completed': 'success',
    }
    return statusMap[status?.toLowerCase()] || 'default'
}

/**
 * Get status icon based on status string
 * @param {string} status - Status value
 * @returns {string} Material icon name
 */
export const getStatusIcon = (status) => {
    const iconMap = {
        'active': 'check_circle',
        'inactive': 'cancel',
        'pending': 'schedule',
        'error': 'error',
        'urgent': 'warning',
        'success': 'check_circle',
        'approved': 'done_all',
        'rejected': 'close',
    }
    return iconMap[status?.toLowerCase()] || 'help'
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
    if (!text) return ''
    return text.length > length ? `${text.substring(0, length)}...` : text
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Parse query parameters from URL
 * @param {string} searchParams - URL search params
 * @returns {object} Parsed params object
 */
export const parseQueryParams = (searchParams) => {
    const params = new URLSearchParams(searchParams)
    const result = {}
    for (const [key, value] of params) {
        result[key] = value
    }
    return result
}

/**
 * Debounce function for performance optimization
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
export const debounce = (func, delay = 300) => {
    let timeoutId
    return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

/**
 * Check if string is valid email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
