import express from 'express'
import * as controller from './category.controller.js'

import validate from '../../middleware/validation.middleware.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'

import {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation.js'

import { ROLES } from '../../utils/constants.js'

const router = express.Router()

/* =========================
   GET ALL (ALL ROLES)
========================= */
router.get('/', controller.getAllCategories)

/* =========================
   GET ONE (ALL ROLES)
========================= */
router.get('/:id', controller.getCategoryById)

/* =========================
   CREATE (ONLY CO-FOUNDER)
========================= */
router.post(
  '/',
  auth,
  requireRole(ROLES.ADMIN),
  validate(createCategorySchema),
  controller.createCategory
)

/* =========================
   UPDATE (ONLY CO-FOUNDER)
========================= */
   router.put(
   '/:id',
   auth,
   requireRole(ROLES.ADMIN),
   validate(updateCategorySchema),
   controller.updateCategory
   )

/* =========================
   DELETE (ONLY CO-FOUNDER)
========================= */
router.delete(
  '/:id',
  auth,
  requireRole(ROLES.ADMIN),
  controller.deleteCategory
)

export default router