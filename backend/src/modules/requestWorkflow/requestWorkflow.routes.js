import express from 'express'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import * as controller from './requestWorkflow.controller.js'

const router = express.Router()

router.get(
    '/statuses',
    auth,
    requirePermission(PERMISSIONS.REQUESTS_MANAGE),
    controller.getRequestStatusCatalog
)

export default router
