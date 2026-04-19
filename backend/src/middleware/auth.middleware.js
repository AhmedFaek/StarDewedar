const jwt = require('jsonwebtoken')
const env = require('../config/env')

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

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