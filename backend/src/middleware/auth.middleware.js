import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import * as userRepo from '../modules/users/user.repository.js'

let lookupUser = (id) => userRepo.findUserById(id)

/**
 * Test seam: replace the user lookup (e.g. with an in-memory fake).
 * Pass nothing to restore the database-backed lookup.
 */
export const setUserLookup = (fn) => {
    lookupUser = fn || ((id) => userRepo.findUserById(id))
}

export const optionalAuth = async (req, res, next) => {
    const authorization = req.headers?.authorization
    if (authorization === undefined) return next()

    const match = typeof authorization === 'string'
        ? authorization.match(/^Bearer +(\S+)$/i)
        : null
    if (!match) {
        return res.status(401).json({
            success: false,
            code: 'OPTIONAL_AUTH_INVALID',
            message: 'Invalid access token',
        })
    }

    try {
        const decoded = jwt.verify(match[1], env.jwtSecret)
        const user = await lookupUser(decoded.userId)
        if (!user) {
            return res.status(401).json({
                success: false,
                code: 'OPTIONAL_AUTH_INVALID',
                message: 'Invalid access token',
            })
        }

        req.user = { userId: user.id, role: user.role, name: user.name }
        return next()
    } catch (err) {
        if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError' || err?.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                code: 'OPTIONAL_AUTH_INVALID',
                message: 'Invalid access token',
            })
        }
        return next(err)
    }
}

/**
 * Verifies the access token, then loads the user from the database so that
 * role changes and account deletion take effect immediately instead of after
 * the 15-minute access-token lifetime. The role placed on req.user always
 * comes from the database, never from the token payload.
 */
export default async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const decoded = jwt.verify(token, env.jwtSecret)

        const user = await lookupUser(decoded.userId)
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' })
        }

        req.user = { userId: user.id, role: user.role, name: user.name }

        next()
    } catch (err) {
        if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError' || err?.name === 'NotBeforeError') {
            return res.status(401).json({ message: 'Invalid token' })
        }
        next(err)
    }
}