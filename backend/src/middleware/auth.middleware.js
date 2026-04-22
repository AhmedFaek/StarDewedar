import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export default (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        console.log('Auth Middleware - Token:', token) // Debug log
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const decoded = jwt.verify(token, env.jwtSecret)

        req.user = decoded

        next()
    } catch {
        res.status(401).json({ message: 'Invalid token' })
    }
}