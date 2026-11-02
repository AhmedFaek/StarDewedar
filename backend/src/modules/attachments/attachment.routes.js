import express from 'express'
import * as controller from './attachment.controller.js'
import * as cleanupController from './cleanup.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

router.get('/cleanup', auth, requireRole(ROLES.SUPER_ADMIN), cleanupController.listCleanupOperations)
router.post(
    '/cleanup/:id/retry',
    auth,
    requireRole(ROLES.SUPER_ADMIN),
    validateUuidParam(),
    cleanupController.retryCleanupOperation
)
router.get('/:id', auth, validateUuidParam(), controller.getAttachment)
router.get('/:id/download', auth, validateUuidParam(), controller.downloadAttachment)

export default router
