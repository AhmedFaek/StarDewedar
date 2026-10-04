export const ROLES = {
    ADMIN: 'admin',
    CUSTOMER: 'customer',
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Timezone offset (in hours) used for day/month boundary calculations.
 * UTC+3 = Africa/Cairo (Egypt Standard Time).
 * Change this if the business timezone changes.
 */
export const ANALYTICS_TIMEZONE_OFFSET_HOURS = 3

/**
 * A visitor is considered "active" if their last heartbeat was within this window.
 * Default: 90 seconds
 */
export const ACTIVE_VISITOR_WINDOW_MS = 90 * 1000

/**
 * How often the public frontend should send a heartbeat (in milliseconds).
 * Should be less than ACTIVE_VISITOR_WINDOW_MS to keep visitors counted as active.
 * Default: 45 seconds
 */
export const ANALYTICS_HEARTBEAT_INTERVAL_MS = 45 * 1000
