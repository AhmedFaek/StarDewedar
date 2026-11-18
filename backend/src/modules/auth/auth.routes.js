import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { getClientIp } from '../../utils/clientIp.js'
import * as controller from './auth.controller.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import { createTwoTierIpLimiters } from './authRateLimiters.js'
import {
    registerSchema,
    createUserSchema,
    loginSchema,
    refreshSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailSchema,
    resendVerificationSchema,
} from './auth.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'

const router = express.Router()

/* ─── Rate limiters ──────────────────────────────────────────────────────── */

const verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: 'Too many verification attempts. Please try again later.',
    },
})

const resendVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: 'Too many verification code requests. Please try again later.',
    },
})

const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: 'Too many password reset attempts. Please try again later.',
    },
})

export const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId
        ? `user:${req.user.userId}`
        : ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: 'Too many password change attempts. Please try again later.',
    },
})

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: 'Too many login attempts. Please try again later.',
    },
})

const registerLimiters = createTwoTierIpLimiters(
    'Too many account creation attempts. Please try again later.'
)
const forgotPasswordLimiters = createTwoTierIpLimiters(
    'Too many password reset requests. Please try again later.'
)

// ── Public routes ────────────────────────────────────────────────────────────

// Customer self-registration
router.post(
    '/register',
    registerLimiters.coarseLimiter,
    verifyTurnstile,
    registerLimiters.passedChallengeLimiter,
    validate(registerSchema),
    controller.register
)

// Verify email
router.post(
    '/verify-email',
    verifyEmailLimiter,
    validate(verifyEmailSchema),
    controller.verifyEmail
)

// Resend verification code
router.post(
    '/resend-verification',
    resendVerificationLimiter,
    validate(resendVerificationSchema),
    controller.resendVerification
)

// Login (any role)
router.post('/login', loginLimiter, validate(loginSchema), controller.login)

// Refresh access token
router.post('/refresh', validate(refreshSchema), controller.refresh)

// Forgot password (rate-limited)
router.post(
    '/forgot-password',
    forgotPasswordLimiters.coarseLimiter,
    verifyTurnstile,
    forgotPasswordLimiters.passedChallengeLimiter,
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
    changePasswordLimiter,
    validate(changePasswordSchema),
    controller.changePassword
)

// Create a user (super admin only)
router.post(
    '/create-user',
    auth,
    requirePermission(PERMISSIONS.USERS_MANAGE),
    validate(createUserSchema),
    controller.createUser
)

export default router