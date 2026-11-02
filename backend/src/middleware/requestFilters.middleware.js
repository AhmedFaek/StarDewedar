import { REQUEST_STATUSES } from '../utils/requestStatus.js'

export const validateArchivedQuery = (req, res, next) => {
    const { archived } = req.query
    if (archived === undefined || archived === 'false') {
        req.requestArchived = false
    } else if (archived === 'true') {
        req.requestArchived = true
    } else {
        return res.status(400).json({
            success: false,
            message: 'The archived query parameter must be true or false.',
        })
    }

    next()
}

export const validateRequestStatusParam = (req, res, next) => {
    const status = String(req.params.status || '').toLowerCase()
    if (!REQUEST_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request status.',
        })
    }

    req.params.status = status
    next()
}
