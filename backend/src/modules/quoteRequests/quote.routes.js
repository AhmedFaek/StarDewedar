import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './quote.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateQuoteRequestSchema } from './quote.validation.js'

import upload from '../../middleware/upload.middleware.js'

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
router.post('/', quoteLimiter, upload.single('file'), controller.createQuote)

// Get all quote requests
router.get('/', auth,
    requireRole(ROLES.ADMIN),
    controller.getQuotes)

// Get quote requests by status
router.get('/status/:status', auth,
    requireRole(ROLES.ADMIN),
    controller.getQuotesByStatus)

// Get quote requests by email
router.get('/email/:email', auth,
    requireRole(ROLES.ADMIN),
    controller.getQuotesByEmail)

// Get single quote request by ID
router.get('/:id', auth,
    requireRole(ROLES.ADMIN),
    controller.getQuoteById)

// Update quote request (e.g., change status)
router.put('/:id', auth,
    requireRole(ROLES.ADMIN),
    validate(updateQuoteRequestSchema),
    controller.updateQuote)

// Delete quote request
router.delete('/:id', auth,
    requireRole(ROLES.ADMIN),
    controller.deleteQuote)

export default router
