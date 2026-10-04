// analytics.service.js
import * as repo from './analytics.repository.js'
import { ACTIVE_VISITOR_WINDOW_MS } from '../../utils/constants.js'
import crypto from 'crypto'

/**
 * Hash an IP address using SHA-256.
 * The raw IP is never stored — only the hash.
 *
 * @param {string|undefined} ip - Raw IP from request
 * @returns {string|null}
 */
function hashIp(ip) {
    if (!ip) return null
    return crypto.createHash('sha256').update(ip).digest('hex')
}

/**
 * Process a heartbeat from the public website.
 * Creates a new session or updates lastSeenAt for an existing one.
 *
 * @param {string} sessionId - Client-generated UUID
 * @param {string|undefined} rawIp - Remote IP (will be hashed, not stored raw)
 * @returns {Promise<{sessionId: string, isNew: boolean}>}
 */
export const processHeartbeat = (sessionId, rawIp) => {
    const ipHash = hashIp(rawIp)
    return repo.upsertSession(sessionId, ipHash)
}

/**
 * Get analytics overview for the admin dashboard.
 * Runs all four counts in parallel for efficiency.
 */
export const getOverview = async () => {
    const [
        activeVisitors,
        todayVisitors,
        thisMonthVisitors,
        lastMonthVisitors,
    ] = await Promise.all([
        repo.countActiveSessions(ACTIVE_VISITOR_WINDOW_MS),
        repo.countTodaySessions(),
        repo.countThisMonthSessions(),
        repo.countLastMonthSessions(),
    ])

    return {
        activeVisitors,
        todayVisitors,
        thisMonthVisitors,
        lastMonthVisitors,
    }
}

/**
 * Get daily visitor counts for the chart.
 *
 * @param {number} days - Number of recent days (default 30, max 90)
 */
export const getDailyVisitors = (days = 30) => {
    const safeDays = Math.min(90, Math.max(1, parseInt(days, 10) || 30))
    return repo.getDailyVisitors(safeDays)
}
