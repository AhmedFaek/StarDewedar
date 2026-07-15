import { getValidAccessToken, refreshAccessToken, saveTokens, saveUser, clearAuth } from './auth.js'
import { createApiError } from './apiErrorHandler.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── In-memory cache for static catalog endpoints ──────────────────────────────
const CACHE_TTL = 60_000 // 60 seconds
const cache = new Map() // key → { data, timestamp, promise }

function cachedFetch(key, fetchFn) {
  const now = Date.now()
  const entry = cache.get(key)

  // Return cached data if still valid
  if (entry && entry.data !== undefined && now - entry.timestamp < CACHE_TTL) {
    return Promise.resolve(entry.data)
  }

  // Deduplicate: if a request for this key is already in-flight, reuse it
  if (entry && entry.promise) {
    return entry.promise
  }

  // Start new fetch and store the promise for deduplication
  const promise = fetchFn()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now(), promise: null })
      return data
    })
    .catch((err) => {
      cache.delete(key)
      throw err
    })

  cache.set(key, { ...(entry || {}), promise })
  return promise
}
// ──────────────────────────────────────────────────────────────────────────────

const readResponseBody = async (response) => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const handleResponse = async (response) => {
  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createApiError(response, body)
  }

  return body
}

const authFetch = async (url, options = {}) => {
  const token = await getValidAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let res = await fetch(url, { ...options, headers })
  if (res.status === 401 && !url.includes('/auth/refresh')) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      const retryHeaders = {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      }
      res = await fetch(url, { ...options, headers: retryHeaders })
    } else {
      clearAuth()
      throw {
        __normalizedApiError: true,
        message: 'Session expired. Please log in again.',
        status: 401,
      }
    }
  }

  if (res.status === 401) {
    clearAuth()
    throw {
      __normalizedApiError: true,
      message: 'Session expired. Please log in again.',
      status: 401,
    }
  }

  return handleResponse(res)
}

export const api = {
  // ── Cached static catalog endpoints ──────────────────────────────────────
  getProducts: () => cachedFetch('products', () => fetch(`${API_URL}/products`).then(handleResponse)),
  getProductById: (id) => cachedFetch(`product:${id}`, () => fetch(`${API_URL}/products/${id}`).then(handleResponse)),
  getCategories: () => cachedFetch('categories', () => fetch(`${API_URL}/categories`).then(handleResponse)),
  getProjects: () => cachedFetch('projects', () => fetch(`${API_URL}/projects`).then(handleResponse)),
  getProjectById: (id) => cachedFetch(`project:${id}`, () => fetch(`${API_URL}/projects/${id}`).then(handleResponse)),

  sendContactMessage: (data) => fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),

  sendQuoteRequest: (data) => {
    const isFormData = data instanceof FormData
    return fetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    }).then(handleResponse)
  },

  sendVisitRequest: (data) => fetch(`${API_URL}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),

  register: (data) => fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    const body = await readResponseBody(res)
    if (!res.ok) throw createApiError(res, body)
    saveTokens(body.accessToken, body.refreshToken)
    saveUser(body.user)
    return body
  }),

  login: (email, password) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(async (res) => {
    const body = await readResponseBody(res)
    if (!res.ok) throw createApiError(res, body)
    saveTokens(body.accessToken, body.refreshToken)
    saveUser(body.user)
    return body
  }),

  logout: () => authFetch(`${API_URL}/auth/logout`, { method: 'POST' })
    .finally(() => clearAuth()),

  forgotPassword: (email) => fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(handleResponse),

  resetPassword: (token, newPassword) => fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  }).then(handleResponse),

  changePassword: (currentPassword, newPassword) => authFetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  }),

  getMe: () => authFetch(`${API_URL}/users/me`),

  getSavedProducts: () => authFetch(`${API_URL}/users/me/saved-products`),
  checkSaved: (productId) => authFetch(`${API_URL}/users/me/saved-products/${productId}/check`),
  saveProduct: (productId) => authFetch(`${API_URL}/users/me/saved-products/${productId}`, { method: 'POST' }),
  unsaveProduct: (productId) => authFetch(`${API_URL}/users/me/saved-products/${productId}`, { method: 'DELETE' }),

  getMyQuotes: () => authFetch(`${API_URL}/users/me/quotes`),
  getMyVisits: () => authFetch(`${API_URL}/users/me/visits`),

  getLocalizedField: (obj, field, lang) => {
    if (!obj) return ''
    const fieldName = `${field}_${lang}`
    return obj[fieldName] || obj[`${field}_en`] || obj[field] || ''
  },
}
