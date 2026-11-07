import express from 'express'
import * as controller from './contact.controller.js'
import { createContactSchema } from './contact.validation.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'
import { createTwoTierIpLimiters } from '../auth/authRateLimiters.js'

const router = express.Router()

const contactLimiters = createTwoTierIpLimiters(
    'Too many contact messages sent. Please try again later.',
    { passedChallengeMax: 10 }
)

// Public route (website users)
// Flow: coarse limiter → Turnstile verify → strict limiter → Zod validation → controller
router.post(
    '/',
    contactLimiters.coarseLimiter,
    verifyTurnstile,
    contactLimiters.passedChallengeLimiter,
    validate(createContactSchema),
    controller.createContact
)

// Admin only (dashboard)
router.get(
    '/',
    auth,
    requirePermission(PERMISSIONS.SUPPORT_MANAGE),
    controller.getAllMessages
)

export default router