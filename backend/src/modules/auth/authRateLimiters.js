import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { getClientIp } from '../../utils/clientIp.js'

const createIpLimiter = ({ windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getClientIp(req)),
    // X-Forwarded-For is intentionally ignored; the configured source is X-Real-IP or the socket.
    validate: { xForwardedForHeader: false },
    message: { message },
})

export const createTwoTierIpLimiters = (message, { passedChallengeMax = 10 } = {}) => ({
    coarseLimiter: createIpLimiter({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message,
    }),
    passedChallengeLimiter: createIpLimiter({
        windowMs: 60 * 60 * 1000,
        max: passedChallengeMax,
        message,
    }),
})
