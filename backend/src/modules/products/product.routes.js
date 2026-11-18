import express from 'express'
import * as controller from './product.controller.js'

import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { productFileUpload } from '../../middleware/upload.middleware.js'
import { createAdminWriteLimiter } from '../../middleware/adminWriteLimiter.js'

import { createProductSchema, updateProductSchema } from './product.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'

import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()
export const productWriteLimiter = createAdminWriteLimiter('product')

/* =========================
   CREATE PRODUCT
========================= */
router.post(
    '/',
    auth,
    requirePermission(PERMISSIONS.CATALOG_MANAGE),
    productWriteLimiter,
    productFileUpload,
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
router.get('/:id', validateUuidParam(), controller.getProductById)

/* =========================
   UPDATE
========================= */
router.put(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.CATALOG_MANAGE),
    productWriteLimiter,
    validateUuidParam(),
    validate(updateProductSchema),
    controller.updateProduct
)

/* =========================
   DELETE
========================= */
router.delete(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.CATALOG_MANAGE),
    productWriteLimiter,
    validateUuidParam(),
    controller.deleteProduct
)

export default router