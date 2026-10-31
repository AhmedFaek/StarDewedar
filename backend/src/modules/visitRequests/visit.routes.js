import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './visit.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateVisitRequestSchema } from './visit.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { singleFileUpload } from '../../middleware/upload.middleware.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'

const router = express.Router()

const visitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many visit requests submitted. Please try again later.',
    },
})

// Create a new visit request
// Flow: rate limiter → Turnstile → bounded multipart parser → controller validation
router.post('/', visitLimiter, verifyTurnstile, singleFileUpload, controller.createVisit)

// Get all visit requests
router.get('/', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getVisits)

// Get visit requests by status
router.get('/status/:status', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getVisitsByStatus)

// Get visit requests by email
router.get('/email/:email', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getVisitsByEmail)

// Get single visit request by ID
router.get('/:id', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    controller.getVisitById)

// Update visit request (e.g., change status)
router.put('/:id', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    validate(updateVisitRequestSchema),
    controller.updateVisit)

// Delete visit request
router.delete('/:id', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    controller.deleteVisit)

export default router
