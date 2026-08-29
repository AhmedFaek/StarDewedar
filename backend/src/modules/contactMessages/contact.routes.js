import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './contact.controller.js'
import { createContactSchema } from './contact.validation.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many contact messages sent. Please try again later.',
    },
})

// Public route (website users)
router.post('/', contactLimiter, validate(createContactSchema), controller.createContact)

// Admin only (dashboard)
router.get(
    '/',
    auth,
    requireRole(ROLES.ADMIN),
    controller.getAllMessages
)

export default router