import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './conversation.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

/* ─── Rate limiters ───────────────────────────────────────────────────────── */

// 5 new conversations per customer per hour
const createConversationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many conversations started. Please try again later.' },
})

// 30 messages per 15 minutes per IP
const sendMessageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many messages sent. Please slow down.' },
})

/* ─── Customer routes — all require auth + customer role ──────────────────── */

// All customer conversation routes require a verified account
// (The login gate already enforces email_verified = true for customers)
router.use(auth)
router.use(requireRole(ROLES.CUSTOMER))

// POST   /api/conversations
router.post('/', createConversationLimiter, controller.createConversation)

// GET    /api/conversations
router.get('/', controller.getMyConversations)

// GET    /api/conversations/:id
router.get('/:id', validateUuidParam(), controller.getMyConversationById)

// GET    /api/conversations/:id/messages
router.get('/:id/messages', validateUuidParam(), controller.getMyMessages)

// POST   /api/conversations/:id/messages
router.post('/:id/messages', sendMessageLimiter, validateUuidParam(), controller.sendMessage)

// PATCH  /api/conversations/:id/close
router.patch('/:id/close', validateUuidParam(), controller.closeConversation)

// PATCH  /api/conversations/:id/reopen
router.patch('/:id/reopen', validateUuidParam(), controller.reopenConversation)

export default router
