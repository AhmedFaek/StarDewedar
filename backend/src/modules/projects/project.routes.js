import express from 'express'
import * as controller from './project.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import upload from '../../middleware/upload.middleware.js'
import { ROLES } from '../../utils/constants.js'
import { createProjectSchema } from './project.validation.js'
import validate from '../../middleware/validation.middleware.js'

const router = express.Router()

router.get('/', controller.getProjects)
router.get('/:id', controller.getProjectById)

router.post(
    '/',
    auth,
    requireRole(ROLES.ADMIN),
    upload.array('images'),        // ✅ multer parses multipart body first
    validate(createProjectSchema), // ✅ now req.body is populated
    controller.createProject
)

router.put(
    '/:id',
    auth,
    requireRole(ROLES.ADMIN),
    controller.updateProject
)

router.delete(
    '/:id',
    auth,
    requireRole(ROLES.ADMIN),
    controller.deleteProject
)

export default router