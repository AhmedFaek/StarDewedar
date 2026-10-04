// dashboard.routes.js
import express from 'express'
import * as controller from './dashboard.controller.js'
import * as convController from '../conversations/conversation.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { ROLES } from '../../utils/constants.js'
import rateLimit from 'express-rate-limit'
import { adminRouter as analyticsAdminRouter } from '../analytics/analytics.routes.js'

const router = express.Router()

// Admin reply rate limiter — 60 messages per 15 minutes
const adminReplyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many messages sent. Please slow down.' },
})

// All dashboard routes require admin authentication
router.use(auth, requireRole(ROLES.ADMIN))

/* ─── Analytics ──────────────────────────────────────────────────────────── */

router.use('/analytics', analyticsAdminRouter)

/* ─── Stats ─────────────────────────────────────────────────────────────── */

router.get('/stats', controller.getStats)

/* ─── Admin: Conversations ────────────────────────────────────────────────── */

// GET    /api/dashboard/conversations
router.get('/conversations', convController.adminGetConversations)

// GET    /api/dashboard/conversations/:id
router.get('/conversations/:id', validateUuidParam(), convController.adminGetConversationById)

// GET    /api/dashboard/conversations/:id/messages
router.get('/conversations/:id/messages', validateUuidParam(), convController.adminGetMessages)

// POST   /api/dashboard/conversations/:id/messages
router.post('/conversations/:id/messages', adminReplyLimiter, validateUuidParam(), convController.adminSendMessage)

// PATCH  /api/dashboard/conversations/:id/close
router.patch('/conversations/:id/close', validateUuidParam(), convController.adminCloseConversation)

// PATCH  /api/dashboard/conversations/:id/reopen
router.patch('/conversations/:id/reopen', validateUuidParam(), convController.adminReopenConversation)

export default router