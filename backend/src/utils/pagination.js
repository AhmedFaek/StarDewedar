/**
 * Helper to parse pagination params from req.query with safe bounds.
 * @param {object} query - req.query object
 * @param {number} defaultLimit - default limit if not specified (default: 50)
 * @param {number} maxLimit - max ceiling limit (default: 100)
 */
export const getPaginationParams = (query = {}, defaultLimit = 50, maxLimit = 100) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1)
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit))
    const skip = (page - 1) * limit
    return { take: limit, skip, page, limit }
}
