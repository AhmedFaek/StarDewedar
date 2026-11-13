import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { getClientIp } from '../../utils/clientIp.js'
import { downloadEmailAttachment } from './emailAttachmentAccess.controller.js'

const router = express.Router()

const emailAttachmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        success: false,
        message: 'Too many attachment link requests. Please try again later.',
    },
})

router.get('/email/:token', emailAttachmentLimiter, downloadEmailAttachment)

export default router
