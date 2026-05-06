// Application constants

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000

// HTTP Methods
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
}

// Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
}

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    CUSTOMER: 'customer',
}

// Request Status
export const REQUEST_STATUS = {
    PENDING: 'Pending Action',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Sent to Client',
    REJECTED: 'Action Required',
    COMPLETED: 'Completed',
}

// Project Status
export const PROJECT_STATUS = {
    PLANNING: 'Planning',
    ON_TRACK: 'On-Track',
    AT_RISK: 'At Risk',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
}

// Product Status
export const PRODUCT_STATUS = {
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
    DISCONTINUED: 'Discontinued',
}

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    DEFAULT_SORT: 'createdAt',
    DEFAULT_ORDER: 'desc',
}

// Date Formats
export const DATE_FORMATS = {
    DISPLAY: 'MMM dd, yyyy',
    DISPLAY_TIME: 'MMM dd, yyyy | HH:mm',
    API: 'yyyy-MM-dd',
    API_TIME: 'yyyy-MM-ddTHH:mm:ss',
}

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND: 'The requested resource was not found.',
}

// Success Messages
export const SUCCESS_MESSAGES = {
    CREATED: 'Item created successfully.',
    UPDATED: 'Item updated successfully.',
    DELETED: 'Item deleted successfully.',
    SAVED: 'Changes saved successfully.',
}

// Navigation Items
export const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { id: 'categories', label: 'Categories', icon: 'category', path: '/categories' },
    { id: 'products', label: 'Products', icon: 'inventory_2', path: '/products' },
    { id: 'projects', label: 'Projects', icon: 'architecture', path: '/projects' },
    { id: 'quotes', label: 'Quote Requests', icon: 'request_quote', path: '/quotes' },
    { id: 'visits', label: 'Visit Requests', icon: 'calendar_today', path: '/visits' },
    { id: 'messages', label: 'Contact Messages', icon: 'chat', path: '/messages' },
    { id: 'users', label: 'Users', icon: 'group', path: '/users' },
]

export const BOTTOM_NAV_ITEMS = [
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
    { id: 'logout', label: 'Log Out', icon: 'logout', path: '/logout' },
]

// Color Tokens (for reference)
export const COLORS = {
    PRIMARY: '#000e24',
    PRIMARY_CONTAINER: '#00234b',
    TERTIARY: '#6a5f00',
    TERTIARY_FIXED: '#f9e454',
    SECONDARY: '#5d5e61',
    SURFACE: '#f7f9fc',
    SURFACE_CONTAINER_LOW: '#f2f4f7',
    SURFACE_CONTAINER_LOWEST: '#ffffff',
    ERROR: '#ba1a1a',
    SUCCESS: '#006e1c', // Implied from design system
}

// Local Storage Keys
export const STORAGE_KEYS = {
    USER: 'user_data',
    TOKEN: 'auth_token',
    PREFERENCES: 'user_preferences',
    THEME: 'app_theme',
}

// Cache Duration (in seconds)
export const CACHE_DURATION = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 3600,          // 1 hour
    VERY_LONG: 86400,    // 24 hours
}
