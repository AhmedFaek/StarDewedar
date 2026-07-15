/**
 * Auth utility — handles JWT access/refresh tokens and user session state.
 *
 * Storage strategy:
 *  - accessToken  → sessionStorage (clears on tab close, harder to steal via XSS than localStorage)
 *  - refreshToken → localStorage   (persists across sessions)
 *  - user         → localStorage   (non-sensitive user info for UI display)
 */

const KEYS = {
  ACCESS: 'sd_access_token',
  REFRESH: 'sd_refresh_token',
  USER: 'sd_user',
}

// ── Storage helpers ────────────────────────────────────────────────────────

export const saveTokens = (accessToken, refreshToken) => {
  sessionStorage.setItem(KEYS.ACCESS, accessToken)
  localStorage.setItem(KEYS.REFRESH, refreshToken)
}

export const saveUser = (user) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user))
}

export const getAccessToken = () => sessionStorage.getItem(KEYS.ACCESS)
export const getRefreshToken = () => localStorage.getItem(KEYS.REFRESH)
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.USER))
  } catch {
    return null
  }
}

export const clearAuth = () => {
  sessionStorage.removeItem(KEYS.ACCESS)
  localStorage.removeItem(KEYS.REFRESH)
  localStorage.removeItem(KEYS.USER)
}

export const isLoggedIn = () => Boolean(getRefreshToken() && getUser())

// ── Token refresh ──────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Keep track of any active refresh request to avoid concurrent duplicate requests
let refreshPromise = null

/**
 * Attempt to get a fresh access token using the stored refresh token.
 * Returns the new access token or null if refresh fails.
 */
export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        clearAuth()
        return null
      }

      const data = await res.json()
      saveTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    } catch {
      clearAuth()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Returns a valid access token — either the stored one or a freshly refreshed one.
 * Returns null if the user is not authenticated.
 */
export const getValidAccessToken = async () => {
  let token = getAccessToken()
  if (token) {
    const decoded = decodeJwt(token)
    if (decoded && decoded.exp) {
      // Preemptively refresh if token expires in the next 10 seconds
      const isExpired = decoded.exp * 1000 < Date.now() + 10000
      if (!isExpired) {
        return token
      }
    }
  }
  return refreshAccessToken()
}

/**
 * Decode JWT payload without verifying signature (for reading user info client-side).
 */
export const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}
