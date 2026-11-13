import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { getClientIp } from '../../utils/clientIp.js'
import * as controller from './user.controller.js'
import auth from '../../middleware/auth.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { updateProfileSchema } from './user.validation.js'

const router = express.Router()

const profileUpdateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId
        ? `user:${req.user.userId}`
        : ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: 'Too many profile updates. Please try again later.',
    },
})

// All routes require a valid access token
router.use(auth)

// ── Admin: User Management ───────────────────────────────────────────────────

// GET  /api/users       → list all users (super admin only)
router.get('/', requirePermission(PERMISSIONS.USERS_MANAGE), controller.getAllUsers)

// DELETE /api/users/:id → delete a user (super admin only)
router.delete('/:id', requirePermission(PERMISSIONS.USERS_MANAGE), validateUuidParam('id'), controller.deleteUser)

// ── Profile ──────────────────────────────────────────────────────────────────

// GET  /api/users/me  → return the authenticated user's profile (safe fields)
router.get('/me', controller.getMe)

// PATCH /api/users/me → update the authenticated user's editable profile fields
router.patch('/me', profileUpdateLimiter, validate(updateProfileSchema), controller.updateMe)

// ── Saved Products (Favourites) ───────────────────────────────────────────────

// GET  /api/users/me/saved-products              → list all saved products
router.get('/me/saved-products', controller.getMySavedProducts)

// GET  /api/users/me/saved-products/:productId/check → is this product saved?
router.get('/me/saved-products/:productId/check', validateUuidParam('productId'), controller.checkSaved)

// POST /api/users/me/saved-products/:productId   → save a product
router.post('/me/saved-products/:productId', validateUuidParam('productId'), controller.saveProduct)

// DELETE /api/users/me/saved-products/:productId → unsave a product
router.delete('/me/saved-products/:productId', validateUuidParam('productId'), controller.unsaveProduct)

// ── My Requests ───────────────────────────────────────────────────────────────

// GET  /api/users/me/quotes  → list all quote requests submitted by this user's email
router.get('/me/quotes', controller.getMyQuotes)

// GET  /api/users/me/visits  → list all visit requests submitted by this user's email
router.get('/me/visits', controller.getMyVisits)

// GET  /api/users/me/boq     → list all BOQ requests submitted by this user's email
router.get('/me/boq', controller.getMyBOQs)

export default router
