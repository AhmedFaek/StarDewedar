import express from 'express'
import * as controller from './auth.controller.js'
import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import {
    createUserSchema,
    loginSchema,
    refreshSchema,
} from './auth.validation.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

//  LOGIN
router.post('/login', validate(loginSchema), controller.login)

//  REFRESH
router.post('/refresh', validate(refreshSchema), controller.refresh)

//  LOGOUT
router.post('/logout', auth, controller.logout)

//  CREATE USER (ONLY CO-FOUNDER)
router.post(
    '/create-user',
    auth,
    requireRole(ROLES.CO_FOUNDER),
    validate(createUserSchema),
    controller.createUser
)

export default router