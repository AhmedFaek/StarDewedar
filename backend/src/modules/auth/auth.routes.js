const express = require('express')
const controller = require('./auth.controller.js')
const validate = require('../../middleware/validation.middleware.js')
const auth = require('../../middleware/auth.middleware.js')
const { requireRole } = require('../../middleware/roles.middleware.js')
const {
    createUserSchema,
    loginSchema,
    refreshSchema,
} = require('./auth.validation.js')
const { ROLES } = require('../../utils/constants.js')

const router = express.Router()

//  LOGIN
router.post('/login', validate(loginSchema), controller.login)

//  REFRESH
router.post('/refresh', validate(refreshSchema), controller.refresh)

//  CREATE USER (ONLY CO-FOUNDER)
router.post(
    '/create-user',
    auth,
    requireRole(ROLES.CO_FOUNDER),
    validate(createUserSchema),
    controller.createUser
)

module.exports = router