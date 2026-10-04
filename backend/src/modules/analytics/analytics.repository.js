// analytics.repository.js
import prisma from '../../utils/prisma.js'
import { ANALYTICS_TIMEZONE_OFFSET_HOURS } from '../../utils/constants.js'

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Returns the start and end of the current day in the configured timezone,
 * expressed as UTC Date objects (what PostgreSQL stores).
 *
 * ANALYTICS_TIMEZONE_OFFSET_HOURS = +3 for Africa/Cairo (UTC+3)
 */
function getDayBoundsUTC(date = new Date()) {
    // Convert `date` to local calendar date in our timezone
    const offsetMs = ANALYTICS_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
    const localMs = date.getTime() + offsetMs

    const local = new Date(localMs)
    // Extract Y-M-D in that timezone
    const year  = local.getUTCFullYear()
    const month = local.getUTCMonth()
    const day   = local.getUTCDate()

    // Midnight local → subtract offset back to UTC
    const startLocal = Date.UTC(year, month, day, 0, 0, 0, 0)
    const endLocal   = Date.UTC(year, month, day, 23, 59, 59, 999)

    return {
        start: new Date(startLocal - offsetMs),
        end:   new Date(endLocal   - offsetMs),
    }
}

/**
 * Returns the start and end of a given calendar month in the configured
 * timezone, expressed as UTC Date objects.
 *
 * @param {number} year  - Full 4-digit year
 * @param {number} month - 0-based month index (0 = January)
 */
function getMonthBoundsUTC(year, month) {
    const offsetMs = ANALYTICS_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000

    // First moment of this month in local time
    const startLocalMs = Date.UTC(year, month, 1, 0, 0, 0, 0)
    // First moment of next month in local time (= exclusive end)
    const endLocalMs   = Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 1

    return {
        start: new Date(startLocalMs - offsetMs),
        end:   new Date(endLocalMs   - offsetMs),
    }
}

/**
 * Returns the local-timezone year/month for now and for last month.
 */
function getMonthContext(now = new Date()) {
    const offsetMs = ANALYTICS_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
    const local    = new Date(now.getTime() + offsetMs)
    const thisYear  = local.getUTCFullYear()
    const thisMonth = local.getUTCMonth() // 0-based

    const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1

    return { thisYear, thisMonth, lastYear, lastMonth }
}

/* ─── Repository functions ───────────────────────────────────────────────── */

/**
 * Upsert an analytics session.
 * - Creates the session if `session_id` is new.
 * - Updates only `last_seen_at` if the session already exists.
 *
 * @param {string}      sessionId - Client-generated UUID
 * @param {string|null} ipHash    - SHA-256 hash of the raw IP (or null)
 * @returns {Promise<{sessionId: string, isNew: boolean}>}
 */
export const upsertSession = async (sessionId, ipHash) => {
    const now = new Date()

    const session = await prisma.analyticsSession.upsert({
        where:  { session_id: sessionId },
        create: {
            session_id:    sessionId,
            ip_hash:       ipHash,
            first_seen_at: now,
            last_seen_at:  now,
        },
        update: {
            last_seen_at: now,
        },
        select: {
            session_id:    true,
            first_seen_at: true,
        },
    })

    // isNew: first_seen_at equals now (within ~1 second tolerance)
    const isNew = Math.abs(session.first_seen_at.getTime() - now.getTime()) < 2000

    return { sessionId: session.session_id, isNew }
}

/**
 * Count sessions where lastSeenAt >= now - windowMs.
 *
 * @param {number} windowMs - Milliseconds for the active window
 */
export const countActiveSessions = (windowMs) => {
    const since = new Date(Date.now() - windowMs)
    return prisma.analyticsSession.count({
        where: { last_seen_at: { gte: since } },
    })
}

/**
 * Count unique sessions whose firstSeenAt falls within today's boundaries
 * in the configured timezone.
 */
export const countTodaySessions = () => {
    const { start, end } = getDayBoundsUTC()
    return prisma.analyticsSession.count({
        where: { first_seen_at: { gte: start, lte: end } },
    })
}

/**
 * Count unique sessions whose firstSeenAt falls within the current calendar
 * month in the configured timezone.
 */
export const countThisMonthSessions = () => {
    const { thisYear, thisMonth } = getMonthContext()
    const { start, end } = getMonthBoundsUTC(thisYear, thisMonth)
    return prisma.analyticsSession.count({
        where: { first_seen_at: { gte: start, lte: end } },
    })
}

/**
 * Count unique sessions whose firstSeenAt falls within the previous calendar
 * month in the configured timezone.
 */
export const countLastMonthSessions = () => {
    const { lastYear, lastMonth } = getMonthContext()
    const { start, end } = getMonthBoundsUTC(lastYear, lastMonth)
    return prisma.analyticsSession.count({
        where: { first_seen_at: { gte: start, lte: end } },
    })
}

/**
 * Return daily visitor counts (unique sessions by firstSeenAt) for the last
 * `days` days (inclusive of today) in the configured timezone.
 *
 * All `days` dates are guaranteed to be present in ascending chronological order,
 * with 0 for days without any visitors.
 *
 * @param {number} days - Number of recent days to include (default 30)
 * @returns {Promise<Array<{date: string, visitors: number}>>}
 */
export const getDailyVisitors = async (days = 30) => {
    const offsetHours = ANALYTICS_TIMEZONE_OFFSET_HOURS
    const offsetInterval = `${Math.abs(offsetHours)} hours`
    const offsetSign = offsetHours >= 0 ? '+' : '-'

    const now = new Date()
    const offsetMs = offsetHours * 60 * 60 * 1000
    const localNow = new Date(now.getTime() + offsetMs)
    const year  = localNow.getUTCFullYear()
    const month = localNow.getUTCMonth()
    const day   = localNow.getUTCDate()

    // Start of the window: `days - 1` days ago at midnight local time
    const startLocalMs = Date.UTC(year, month, day - (days - 1), 0, 0, 0, 0)
    const windowStart = new Date(startLocalMs - offsetMs)

    // Use Prisma raw query to group by date in the local timezone
    const rows = await prisma.$queryRawUnsafe(`
        SELECT
            TO_CHAR(
                first_seen_at ${offsetSign} INTERVAL '${offsetInterval}',
                'YYYY-MM-DD'
            ) AS date,
            COUNT(*)::int AS visitors
        FROM "AnalyticsSession"
        WHERE first_seen_at >= $1
        GROUP BY date
        ORDER BY date ASC
    `, windowStart)

    const countMap = new Map(rows.map(row => [row.date, row.visitors]))

    const fullSeries = []
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(year, month, day - i, 0, 0, 0, 0))
        const y = d.getUTCFullYear()
        const m = String(d.getUTCMonth() + 1).padStart(2, '0')
        const dt = String(d.getUTCDate()).padStart(2, '0')
        const dateStr = `${y}-${m}-${dt}`
        fullSeries.push({
            date:     dateStr,
            visitors: countMap.get(dateStr) || 0,
        })
    }

    return fullSeries
}
