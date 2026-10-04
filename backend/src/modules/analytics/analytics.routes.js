// analytics.routes.js
import express from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import * as controller from './analytics.controller.js'

const router = express.Router()

/* ─── Validation ─────────────────────────────────────────────────────────── */

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const heartbeatSchema = z.object({
    sessionId: z
        .string({ required_error: 'sessionId is required' })
        .regex(uuidRegex, 'sessionId must be a valid UUID v4'),
})

function validateHeartbeat(req, res, next) {
    const result = heartbeatSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({
            message: result.error.issues?.[0]?.message || 'Invalid request',
        })
    }
    next()
}

/* ─── Rate limiters ──────────────────────────────────────────────────────── */

/**
 * Heartbeat limiter: allows frequent legitimate heartbeats while blocking abuse.
 * 200 requests per 15 minutes per IP = one request every ~4.5 seconds ceiling.
 * A normal visitor sends one every 45 seconds — far below this limit.
 */
const heartbeatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many heartbeat requests. Please slow down.' },
})

/* ─── Public routes ──────────────────────────────────────────────────────── */

// POST /api/analytics/heartbeat
router.post('/heartbeat', heartbeatLimiter, validateHeartbeat, controller.heartbeat)

/* ─── Admin routes ───────────────────────────────────────────────────────── */
// Mounted at /api/dashboard/analytics via dashboard router.
// Auth + requireRole(ADMIN) is applied by the parent dashboard router — do NOT duplicate it here.

const adminRouter = express.Router()

// GET /api/dashboard/analytics/overview
adminRouter.get('/overview', controller.getOverview)

// GET /api/dashboard/analytics/visitors?days=30
adminRouter.get('/visitors', controller.getDailyVisitors)

export { adminRouter }
export default router
