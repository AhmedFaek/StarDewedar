import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './quote.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateQuoteRequestSchema } from './quote.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { singleFileUpload } from '../../middleware/upload.middleware.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'

const router = express.Router()

const quoteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many quote requests submitted. Please try again later.',
    },
})

// Create a new quote request
// Flow: rate limiter → bounded multipart parser → Turnstile → controller validation
router.post('/', quoteLimiter, singleFileUpload, verifyTurnstile, controller.createQuote)

// Get all quote requests
router.get('/', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getQuotes)

// Get quote requests by status
router.get('/status/:status', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getQuotesByStatus)

// Get quote requests by email
router.get('/email/:email', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getQuotesByEmail)

// Get single quote request by ID
router.get('/:id', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    controller.getQuoteById)

// Update quote request (e.g., change status)
router.put('/:id', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    validate(updateQuoteRequestSchema),
    controller.updateQuote)

// Delete quote request
router.delete('/:id', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    controller.deleteQuote)

export default router
