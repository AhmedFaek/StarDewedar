import express from 'express'
import * as controller from './boq.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission, requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateBOQRequestSchema } from './boq.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { ROLES } from '../../utils/constants.js'
import { requestDeletionSchema } from '../attachments/requestDeletion.validation.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { boqUpload } from '../../middleware/upload.middleware.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'
import { validateFormTiming } from '../../middleware/formTiming.middleware.js'
import {
    validateArchivedQuery,
    validateRequestStatusParam,
} from '../../middleware/requestFilters.middleware.js'
import * as workflowController from '../requestWorkflow/requestWorkflow.controller.js'
import { createTwoTierIpLimiters } from '../auth/authRateLimiters.js'

const router = express.Router()

const boqLimiters = createTwoTierIpLimiters(
    'Too many BOQ requests submitted. Please try again later.',
    { passedChallengeMax: 5 }
)

// Create a new BOQ request
// Flow: coarse limiter → fill-time check → Turnstile → strict limiter → multipart parser
router.post(
    '/',
    boqLimiters.coarseLimiter,
    validateFormTiming,
    verifyTurnstile,
    boqLimiters.passedChallengeLimiter,
    boqUpload,
    controller.createBOQ
)

// Get all BOQ requests (admin only)
router.get('/', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateArchivedQuery, controller.getBOQs)

// Get BOQ requests by status (admin only)
router.get('/status/:status', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateRequestStatusParam, validateArchivedQuery, controller.getBOQsByStatus)

// Get BOQ requests by email (admin only)
router.get('/email/:email', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateArchivedQuery, controller.getBOQsByEmail)

router.post('/:id/archive', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateUuidParam(), workflowController.archiveBOQRequest)
router.post('/:id/restore', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateUuidParam(), workflowController.restoreBOQRequest)

// Get single BOQ request by ID (admin only)
router.get('/:id', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateUuidParam(), controller.getBOQById)

// Update BOQ request (admin only)
router.put('/:id', auth, requirePermission(PERMISSIONS.REQUESTS_MANAGE), validateUuidParam(), validate(updateBOQRequestSchema), controller.updateBOQ)

// Delete BOQ request (admin only)
router.delete(
    '/:id',
    auth,
    requireRole(ROLES.SUPER_ADMIN),
    validateUuidParam(),
    validate(requestDeletionSchema),
    controller.deleteBOQ
)

export default router
