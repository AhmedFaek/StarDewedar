import rateLimit from 'express-rate-limit'

const createIpLimiter = ({ windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
})

export const createTwoTierIpLimiters = (message) => ({
    coarseLimiter: createIpLimiter({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message,
    }),
    passedChallengeLimiter: createIpLimiter({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message,
    }),
})
