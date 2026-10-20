import { roleHasPermission } from '../utils/permissions.js'

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    next()
}

/**
 * Permission-based guard. Must run after the auth middleware, which sets
 * req.user.role from the database (never from the client).
 */
export const requirePermission = (permission) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!roleHasPermission(req.user.role, permission)) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    next()
}