import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { getClientIp } from '../utils/clientIp.js'

export const createAdminWriteLimiter = (resource) => rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId
        ? `user:${req.user.userId}`
        : ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: {
        message: `Too many ${resource} updates. Please try again later.`,
    },
})
