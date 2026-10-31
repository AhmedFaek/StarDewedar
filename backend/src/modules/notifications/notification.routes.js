import express from 'express'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { retryRequestNotification } from './notification.controller.js'

const router = express.Router()

router.post(
    '/:requestType/:requestId/retry',
    auth,
    requirePermission(PERMISSIONS.NOTIFICATION_RETRY),
    validateUuidParam('requestId'),
    retryRequestNotification
)

export default router
