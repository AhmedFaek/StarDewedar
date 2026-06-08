import { getValidAccessToken, saveTokens, saveUser, clearAuth } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Something went wrong' }))
        throw error
    }
    return response.json()
}

/**
 * Authenticated fetch — attaches Bearer token and handles 401 refresh-and-retry.
 */
const authFetch = async (url, options = {}) => {
    const token = await getValidAccessToken()
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
        // Token may have just expired mid-request — clearAuth and throw
        clearAuth()
        throw { message: 'Session expired. Please log in again.', status: 401 }
    }
    return handleResponse(res)
}

export const api = {
    // Products
    getProducts: () => fetch(`${API_URL}/products`).then(handleResponse),
    getProductById: (id) => fetch(`${API_URL}/products/${id}`).then(handleResponse),
    getCategories: () => fetch(`${API_URL}/categories`).then(handleResponse),

    // Projects
    getProjects: () => fetch(`${API_URL}/projects`).then(handleResponse),
    getProjectById: (id) => fetch(`${API_URL}/projects/${id}`).then(handleResponse),

    // Contact
    sendContactMessage: (data) => fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),

    // Quotes
    sendQuoteRequest: (data) => {
        const isFormData = data instanceof FormData
        return fetch(`${API_URL}/quotes`, {
            method: 'POST',
            headers: isFormData ? {} : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        }).then(handleResponse)
    },

    // Visits
    sendVisitRequest: (data) => fetch(`${API_URL}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),

    // ── Auth ────────────────────────────────────────────────────────────────

    /** POST /auth/register */
    register: (data) => fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(async (res) => {
        const body = await res.json().catch(() => ({ message: 'Something went wrong' }))
        if (!res.ok) throw body
        saveTokens(body.accessToken, body.refreshToken)
        saveUser(body.user)
        return body
    }),

    /** POST /auth/login */
    login: (email, password) => fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }).then(async (res) => {
        const body = await res.json().catch(() => ({ message: 'Something went wrong' }))
        if (!res.ok) throw body
        saveTokens(body.accessToken, body.refreshToken)
        saveUser(body.user)
        return body
    }),

    /** POST /auth/logout — requires valid access token */
    logout: () => authFetch(`${API_URL}/auth/logout`, { method: 'POST' })
        .finally(() => clearAuth()),

    /** POST /auth/forgot-password — public, rate-limited */
    forgotPassword: (email) => fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }).then(handleResponse),

    /** POST /auth/reset-password — public */
    resetPassword: (token, newPassword) => fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    }).then(handleResponse),

    /** POST /auth/change-password — requires valid access token */
    changePassword: (currentPassword, newPassword) => authFetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    }),

    /** GET /users/me — returns the authenticated user's profile (safe fields) */
    getMe: () => authFetch(`${API_URL}/users/me`),

    // ── Saved Products (Favourites) ──────────────────────────────────────────

    /** GET /users/me/saved-products — list all saved products */
    getSavedProducts: () => authFetch(`${API_URL}/users/me/saved-products`),

    /** GET /users/me/saved-products/:id/check — is this product saved? */
    checkSaved: (productId) => authFetch(`${API_URL}/users/me/saved-products/${productId}/check`),

    /** POST /users/me/saved-products/:id — save a product */
    saveProduct: (productId) => authFetch(`${API_URL}/users/me/saved-products/${productId}`, { method: 'POST' }),

    /** DELETE /users/me/saved-products/:id — unsave a product */
    unsaveProduct: (productId) => authFetch(`${API_URL}/users/me/saved-products/${productId}`, { method: 'DELETE' }),

    // ── My Requests ──────────────────────────────────────────────────────────

    /** GET /users/me/quotes — list all quote requests by the logged-in user's email */
    getMyQuotes: () => authFetch(`${API_URL}/users/me/quotes`),

    /** GET /users/me/visits — list all visit requests by the logged-in user's email */
    getMyVisits: () => authFetch(`${API_URL}/users/me/visits`),

    // ── i18n helper ─────────────────────────────────────────────────────────

    getLocalizedField: (obj, field, lang) => {
        if (!obj) return ''
        const fieldName = `${field}_${lang}`
        return obj[fieldName] || obj[`${field}_en`] || obj[field] || ''
    }
}
