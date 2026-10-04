// analytics.controller.js
import * as service from './analytics.service.js'

/**
 * POST /api/analytics/heartbeat
 * Public endpoint — creates or updates a visitor session.
 */
export const heartbeat = async (req, res, next) => {
    try {
        const { sessionId } = req.body
        const rawIp = req.ip || req.socket?.remoteAddress

        const result = await service.processHeartbeat(sessionId, rawIp)

        // Return only the sessionId — never return analytics data or db IDs
        res.json({ sessionId: result.sessionId })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/dashboard/analytics/overview
 * Admin-only — returns aggregate visitor statistics.
 */
export const getOverview = async (req, res, next) => {
    try {
        const data = await service.getOverview()
        res.json(data)
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/dashboard/analytics/visitors
 * Admin-only — returns daily visitor counts for the chart.
 */
export const getDailyVisitors = async (req, res, next) => {
    try {
        const days = req.query.days || 30
        const data = await service.getDailyVisitors(days)
        res.json(data)
    } catch (err) {
        next(err)
    }
}
