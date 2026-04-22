// dashboard.routes.js
import express from 'express'
import * as controller from './dashboard.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

router.get(
    '/stats',
    auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.getStats
)

export default router