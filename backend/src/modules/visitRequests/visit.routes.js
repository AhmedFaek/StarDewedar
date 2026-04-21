import express from 'express'
import * as controller from './visit.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

// Create a new visit request
router.post('/', controller.createVisit)

// Get all visit requests
router.get('/', auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.getVisits)

// Get visit requests by status
router.get('/status/:status', auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.getVisitsByStatus)

// Get visit requests by email
router.get('/email/:email', auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.getVisitsByEmail)

// Get single visit request by ID
router.get('/:id', auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.getVisitById)

// Update visit request (e.g., change status)
router.put('/:id', auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.updateVisit)

// Delete visit request
router.delete('/:id', auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.deleteVisit)

export default router
