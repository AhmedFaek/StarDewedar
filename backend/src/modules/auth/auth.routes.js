import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './auth.controller.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import {
    registerSchema,
    createUserSchema,
    loginSchema,
    refreshSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from './auth.validation.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

/* ─── Rate limiters ──────────────────────────────────────────────────────── */

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many password reset requests. Please try again later.',
    },
})

const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many password reset attempts. Please try again later.',
    },
})

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts. Please try again later.',
    },
})

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many account creation attempts. Please try again later.',
    },
})

// ── Public routes ────────────────────────────────────────────────────────────

// Customer self-registration
router.post('/register', registerLimiter, validate(registerSchema), controller.register)

// Login (any role)
router.post('/login', loginLimiter, validate(loginSchema), controller.login)

// Refresh access token
router.post('/refresh', validate(refreshSchema), controller.refresh)

// Forgot password (rate-limited)
router.post(
    '/forgot-password',
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    controller.forgotPassword
)

// Reset password
router.post(
    '/reset-password',
    resetPasswordLimiter,
    validate(resetPasswordSchema),
    controller.resetPassword
)

// ── Authenticated routes ──────────────────────────────────────────────────────

// Logout (requires valid access token)
router.post('/logout', auth, controller.logout)

// Change password (requires valid access token)
router.post(
    '/change-password',
    auth,
    validate(changePasswordSchema),
    controller.changePassword
)

// Create a user (admin only)
router.post(
    '/create-user',
    auth,
    requireRole(ROLES.ADMIN),
    validate(createUserSchema),
    controller.createUser
)

export default router