/**
 * analytics.js — Silent first-party analytics heartbeat
 *
 * This module tracks anonymous visitor sessions for the Star Dewedar admin
 * dashboard. It does NOT collect personal data, display any UI to visitors,
 * or use third-party services.
 *
 * Privacy:
 *  - Generates a UUID v4 stored in localStorage under 'sd_visitor_sid'
 *  - Only the anonymous session ID is sent to the backend
 *  - No cookies, no fingerprinting, no personal information
 *
 * Resilience:
 *  - All errors are caught and silently discarded
 *  - The rest of the website is never affected by analytics failures
 */

const SESSION_KEY = 'sd_visitor_sid'
const HEARTBEAT_INTERVAL_MS = 45_000  // 45 seconds — must be < 90s active window

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const HEARTBEAT_ENDPOINT = `${API_URL}/analytics/heartbeat`

/**
 * Generate a UUID v4 using the Web Crypto API (available in all modern browsers).
 * Falls back to a Math.random-based UUID if crypto is unavailable.
 */
function generateUUID() {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID()
    }

    // Fallback for older environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

/**
 * Get or create the anonymous session ID from localStorage.
 */
function getOrCreateSessionId() {
    try {
        let sid = localStorage.getItem(SESSION_KEY)
        if (!sid) {
            sid = generateUUID()
            localStorage.setItem(SESSION_KEY, sid)
        }
        return sid
    } catch {
        // localStorage may be unavailable (private browsing, storage quota, etc.)
        // Fall back to a session-only UUID that won't be persisted
        return generateUUID()
    }
}

/**
 * Send a single heartbeat to the backend.
 * Fails silently — never throws.
 */
async function sendHeartbeat(sessionId) {
    try {
        await fetch(HEARTBEAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
            // Short timeout — don't delay the page if backend is slow
            signal: AbortSignal.timeout(5000),
        })
    } catch {
        // Silently ignore all errors (network, timeout, server down, etc.)
    }
}

/**
 * Initialize the analytics heartbeat.
 *
 * Call this once when the application mounts.
 * Returns a cleanup function that stops the heartbeat interval.
 *
 * @returns {() => void} cleanup function
 */
export function initAnalytics() {
    // Bail out completely if we're in a non-browser environment (SSR, tests)
    if (typeof window === 'undefined') {
        return () => {}
    }

    const sessionId = getOrCreateSessionId()

    // Send initial heartbeat immediately (fire and forget)
    sendHeartbeat(sessionId)

    // Schedule recurring heartbeats while the page is open
    const intervalId = setInterval(() => {
        // Only send if the document is visible (tab is active)
        if (document.visibilityState !== 'hidden') {
            sendHeartbeat(sessionId)
        }
    }, HEARTBEAT_INTERVAL_MS)

    // Return cleanup function to stop the interval on unmount
    return () => clearInterval(intervalId)
}
