// analytics.service.js
import * as repo from './analytics.repository.js'
import { ACTIVE_VISITOR_WINDOW_MS } from '../../utils/constants.js'
import crypto from 'crypto'
import env from '../../config/env.js'

const ANALYTICS_IP_HASH_DOMAIN = 'analytics-ip-v1'

export const hashIp = (ip, pepper = env.verificationCodePepper) => {
    if (!ip) return null

    const key = crypto
        .createHmac('sha256', pepper)
        .update(ANALYTICS_IP_HASH_DOMAIN)
        .digest()

    return crypto.createHmac('sha256', key).update(ip).digest('hex')
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
