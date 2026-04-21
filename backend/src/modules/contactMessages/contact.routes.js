import express from 'express'
import * as controller from './contact.controller.js'
import { createContactSchema } from './contact.validation.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

// Public route (website users)
router.post('/', validate(createContactSchema), controller.createContact)

// Admin only (dashboard)
router.get(
    '/',
    auth,
    requireRole([ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER]),
    controller.getAllMessages
)

export default router