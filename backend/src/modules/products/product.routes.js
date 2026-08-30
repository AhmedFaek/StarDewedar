import express from 'express'
import * as controller from './product.controller.js'

import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import upload from '../../middleware/upload.middleware.js'

import { createProductSchema, updateProductSchema } from './product.validation.js'
import { ROLES } from '../../utils/constants.js'

import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()

/* =========================
   CREATE PRODUCT
========================= */
router.post(
    '/',
    auth,
   requireRole(ROLES.ADMIN),
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
    requireRole(ROLES.ADMIN),
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
    requireRole(ROLES.ADMIN),
    validateUuidParam(),
    controller.deleteProduct
)

export default router