import express from 'express'
import * as controller from './product.controller.js'

import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import upload from '../../middleware/upload.middleware.js'

import { createProductSchema } from './product.validation.js'
import { ROLES } from '../../utils/constants.js'

const router = express.Router()

/* =========================
   CREATE PRODUCT
========================= */
router.post(
    '/',
    auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER),
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'catalog', maxCount: 1 },
    ]),
    validate(createProductSchema),
    controller.createProduct
)

/* =========================
   GET ALL
========================= */
router.get('/', controller.getAllProducts)

/* =========================
   GET ONE
========================= */
router.get('/:id', controller.getProductById)

/* =========================
   UPDATE
========================= */
router.put(
    '/:id',
    auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.updateProduct
)

/* =========================
   DELETE
========================= */
router.delete(
    '/:id',
    auth,
    requireRole(ROLES.CO_FOUNDER, ROLES.PROJECT_MANAGER, ROLES.ACCOUNT_MANAGER),
    controller.deleteProduct
)

export default router