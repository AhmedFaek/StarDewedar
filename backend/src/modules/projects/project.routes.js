import express from 'express'
import * as controller from './project.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import { projectFileUpload } from '../../middleware/upload.middleware.js'
import { createAdminWriteLimiter } from '../../middleware/adminWriteLimiter.js'
import { PERMISSIONS } from '../../utils/permissions.js'
import { createProjectSchema, updateProjectSchema } from './project.validation.js'
import validate from '../../middleware/validation.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()
export const projectWriteLimiter = createAdminWriteLimiter('project')

router.get('/', controller.getProjects)
router.get('/:id', validateUuidParam(), controller.getProjectById)

// Admin-only routes — return real budget
router.get('/admin/all', auth, requirePermission(PERMISSIONS.PROJECTS_MANAGE), controller.getProjectsAdmin)
router.get('/admin/:id', auth, requirePermission(PERMISSIONS.PROJECTS_MANAGE), validateUuidParam(), controller.getProjectByIdAdmin)

router.post(
    '/',
    auth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    projectWriteLimiter,
    projectFileUpload,
    validate(createProjectSchema), // ✅ now req.body is populated
    controller.createProject
)

router.put(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    projectWriteLimiter,
    validateUuidParam(),
    validate(updateProjectSchema),
    controller.updateProject
)

router.delete(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    projectWriteLimiter,
    validateUuidParam(),
    controller.deleteProject
)

export default router