import express from 'express'
import * as controller from './project.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import upload from '../../middleware/upload.middleware.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { createProjectSchema, updateProjectSchema } from './project.validation.js'
import validate from '../../middleware/validation.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()

router.get('/', controller.getProjects)
router.get('/:id', validateUuidParam(), controller.getProjectById)

// Admin-only routes — return real budget
router.get('/admin/all', auth, requirePermission(PERMISSIONS.PROJECTS_MANAGE), controller.getProjectsAdmin)
router.get('/admin/:id', auth, requirePermission(PERMISSIONS.PROJECTS_MANAGE), validateUuidParam(), controller.getProjectByIdAdmin)

router.post(
    '/',
    auth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    upload.array('images', 10),        // max 10 images per upload
    validate(createProjectSchema), // ✅ now req.body is populated
    controller.createProject
)

router.put(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    validateUuidParam(),
    validate(updateProjectSchema),
    controller.updateProject
)

router.delete(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    validateUuidParam(),
    controller.deleteProject
)

export default router