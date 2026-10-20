import express from 'express'
import * as controller from './product.controller.js'

import auth from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import upload from '../../middleware/upload.middleware.js'

import { createProductSchema, updateProductSchema } from './product.validation.js'
import { PERMISSIONS } from '../../utils/permissions.js'

import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()

/* =========================
   CREATE PRODUCT
========================= */
router.post(
    '/',
    auth,
    requirePermission(PERMISSIONS.CATALOG_MANAGE),
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
router.get('/:id', validateUuidParam(), controller.getProductById)

/* =========================
   UPDATE
========================= */
router.put(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.CATALOG_MANAGE),
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
    validateUuidParam(),
    controller.deleteProduct
)

export default router