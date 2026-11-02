import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './quote.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission, requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateQuoteRequestSchema } from './quote.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { ROLES } from '../../utils/constants.js'
import { requestDeletionSchema } from '../attachments/requestDeletion.validation.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { singleFileUpload } from '../../middleware/upload.middleware.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'
import {
    validateArchivedQuery,
    validateRequestStatusParam,
} from '../../middleware/requestFilters.middleware.js'
import * as workflowController from '../requestWorkflow/requestWorkflow.controller.js'

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
// Flow: rate limiter → Turnstile → bounded multipart parser → controller validation
router.post('/', quoteLimiter, verifyTurnstile, singleFileUpload, controller.createQuote)

// Get all quote requests
router.get('/', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateArchivedQuery,
    controller.getQuotes)

// Get quote requests by status
router.get('/status/:status', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateRequestStatusParam,
    validateArchivedQuery,
    controller.getQuotesByStatus)

// Get quote requests by email
router.get('/email/:email', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateArchivedQuery,
    controller.getQuotesByEmail)

router.post('/:id/archive', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    workflowController.archiveQuoteRequest)

router.post('/:id/restore', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    workflowController.restoreQuoteRequest)

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
    requireRole(ROLES.SUPER_ADMIN),
    validateUuidParam(),
    validate(requestDeletionSchema),
    controller.deleteQuote)

export default router
