import express from 'express'
import * as controller from './visit.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission, requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateVisitRequestSchema } from './visit.validation.js'
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
import { createTwoTierIpLimiters } from '../auth/authRateLimiters.js'

const router = express.Router()

const visitLimiters = createTwoTierIpLimiters(
    'Too many visit requests submitted. Please try again later.',
    { passedChallengeMax: 10 }
)

// Create a new visit request
// Flow: coarse limiter → Turnstile → strict limiter → bounded multipart parser → controller
router.post(
    '/',
    visitLimiters.coarseLimiter,
    verifyTurnstile,
    visitLimiters.passedChallengeLimiter,
    singleFileUpload,
    controller.createVisit
)

// Get all visit requests
router.get('/', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateArchivedQuery,
    controller.getVisits)

// Get visit requests by status
router.get('/status/:status', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateRequestStatusParam,
    validateArchivedQuery,
    controller.getVisitsByStatus)

// Get visit requests by email
router.get('/email/:email', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateArchivedQuery,
    controller.getVisitsByEmail)

router.post('/:id/archive', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    workflowController.archiveVisitRequest)

router.post('/:id/restore', auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    validateUuidParam(),
    workflowController.restoreVisitRequest)

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
    requireRole(ROLES.SUPER_ADMIN),
    validateUuidParam(),
    validate(requestDeletionSchema),
    controller.deleteVisit)

export default router
