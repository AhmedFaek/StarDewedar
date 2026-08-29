import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './visit.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateVisitRequestSchema } from './visit.validation.js'
import { ROLES } from '../../utils/constants.js'

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
router.post('/', visitLimiter, controller.createVisit)

// Get all visit requests
router.get('/', auth,
    requireRole(ROLES.ADMIN),
    controller.getVisits)

// Get visit requests by status
router.get('/status/:status', auth,
    requireRole(ROLES.ADMIN),
    controller.getVisitsByStatus)

// Get visit requests by email
router.get('/email/:email', auth,
    requireRole(ROLES.ADMIN),
    controller.getVisitsByEmail)

// Get single visit request by ID
router.get('/:id', auth,
    requireRole(ROLES.ADMIN),
    controller.getVisitById)

// Update visit request (e.g., change status)
router.put('/:id', auth,
    requireRole(ROLES.ADMIN),
    validate(updateVisitRequestSchema),
    controller.updateVisit)

// Delete visit request
router.delete('/:id', auth,
    requireRole(ROLES.ADMIN),
    controller.deleteVisit)

export default router
