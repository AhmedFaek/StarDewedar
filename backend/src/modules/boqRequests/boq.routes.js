import express from 'express'
import rateLimit from 'express-rate-limit'
import * as controller from './boq.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/roles.middleware.js'
import validate from '../../middleware/validation.middleware.js'
import { updateBOQRequestSchema } from './boq.validation.js'
import { ROLES } from '../../utils/constants.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'
import { boqUpload } from '../../middleware/upload.middleware.js'
import { verifyTurnstile } from '../../middleware/turnstile.middleware.js'

const router = express.Router()

const boqLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many BOQ requests submitted. Please try again later.',
    },
})

// Create a new BOQ request
// Flow: rate limiter → multer (boq_file + supporting_docs fields) → Turnstile verify → controller
router.post('/', boqLimiter, boqUpload, verifyTurnstile, controller.createBOQ)

// Get all BOQ requests (admin only)
router.get('/', auth, requireRole(ROLES.ADMIN), controller.getBOQs)

// Get BOQ requests by status (admin only)
router.get('/status/:status', auth, requireRole(ROLES.ADMIN), controller.getBOQsByStatus)

// Get BOQ requests by email (admin only)
router.get('/email/:email', auth, requireRole(ROLES.ADMIN), controller.getBOQsByEmail)

// Get single BOQ request by ID (admin only)
router.get('/:id', auth, requireRole(ROLES.ADMIN), validateUuidParam(), controller.getBOQById)

// Update BOQ request (admin only)
router.put('/:id', auth, requireRole(ROLES.ADMIN), validateUuidParam(), validate(updateBOQRequestSchema), controller.updateBOQ)

// Delete BOQ request (admin only)
router.delete('/:id', auth, requireRole(ROLES.ADMIN), validateUuidParam(), controller.deleteBOQ)

export default router
