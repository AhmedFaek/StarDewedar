import express from 'express'
import rateLimit from 'express-rate-limit'
import { downloadEmailAttachment } from './emailAttachmentAccess.controller.js'

const router = express.Router()

const emailAttachmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attachment link requests. Please try again later.',
    },
})

router.get('/email/:token', emailAttachmentLimiter, downloadEmailAttachment)

export default router
