import { z } from 'zod'

const uuidSchema = z.string().uuid()

/**
 * Express middleware to validate req.params.id (or specified param name) is a valid UUID.
 * Returns 400 Bad Request if invalid format.
 */
export const validateUuidParam = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName]
        const result = uuidSchema.safeParse(id)
        if (!result.success) {
            return res.status(400).json({ message: `Invalid ID format` })
        }
        next()
    }
}
