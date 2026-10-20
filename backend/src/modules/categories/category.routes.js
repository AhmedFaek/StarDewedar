import express from 'express'
import * as controller from './category.controller.js'

import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'

import {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation.js'

import { PERMISSIONS } from '../../utils/permissions.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()

/* =========================
   GET ALL (ALL ROLES)
========================= */
router.get('/', controller.getAllCategories)

/* =========================
   GET ONE (ALL ROLES)
========================= */
router.get('/:id', validateUuidParam(), controller.getCategoryById)

/* =========================
   CREATE (ONLY CO-FOUNDER)
========================= */
router.post(
  '/',
  auth,
  requirePermission(PERMISSIONS.CATALOG_MANAGE),
  validate(createCategorySchema),
  controller.createCategory
)

/* =========================
   UPDATE (ONLY CO-FOUNDER)
========================= */
   router.put(
   '/:id',
   auth,
   requirePermission(PERMISSIONS.CATALOG_MANAGE),
   validateUuidParam(),
   validate(updateCategorySchema),
   controller.updateCategory
   )

/* =========================
   DELETE (ONLY CO-FOUNDER)
========================= */
router.delete(
  '/:id',
  auth,
  requirePermission(PERMISSIONS.CATALOG_MANAGE),
  validateUuidParam(),
  controller.deleteCategory
)

export default router