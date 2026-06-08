import { getValidAccessToken, saveTokens, saveUser, clearAuth } from './auth.js'
import { createApiError } from './apiErrorHandler.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

  const res = await fetch(url, { ...options, headers })
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
  getProducts: () => fetch(`${API_URL}/products`).then(handleResponse),
  getProductById: (id) => fetch(`${API_URL}/products/${id}`).then(handleResponse),
  getCategories: () => fetch(`${API_URL}/categories`).then(handleResponse),

  getProjects: () => fetch(`${API_URL}/projects`).then(handleResponse),
  getProjectById: (id) => fetch(`${API_URL}/projects/${id}`).then(handleResponse),

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
