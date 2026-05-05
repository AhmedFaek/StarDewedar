import express from 'express'
import * as controller from './auth.controller.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import {
    registerSchema,
    createUserSchema,
    loginSchema,
    refreshSchema,
} from './auth.validation.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

// ── Public routes ────────────────────────────────────────────────────────────

// Customer self-registration
router.post('/register', validate(registerSchema), controller.register)

// Login (any role)
router.post('/login', validate(loginSchema), controller.login)

// Refresh access token
router.post('/refresh', validate(refreshSchema), controller.refresh)

// ── Authenticated routes ──────────────────────────────────────────────────────

// Logout (requires valid access token)
router.post('/logout', auth, controller.logout)

// Create a user (admin only)
router.post(
    '/create-user',
    auth,
    requireRole(ROLES.ADMIN),
    validate(createUserSchema),
    controller.createUser
)

export default router