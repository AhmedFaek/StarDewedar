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