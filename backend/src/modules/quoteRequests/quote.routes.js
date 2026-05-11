import express from 'express'
import * as controller from './quote.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { ROLES } from '../../utils/constants.js'

import upload from '../../middleware/upload.middleware.js'

const router = express.Router()

// Create a new quote request
router.post('/', upload.single('file'), controller.createQuote)

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
    controller.updateQuote)

// Delete quote request
router.delete('/:id', auth,
    requireRole(ROLES.ADMIN),
    controller.deleteQuote)

export default router
