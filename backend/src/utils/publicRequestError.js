import { ZodError } from 'zod'
import { UploadValidationError } from './uploadValidation.js'

const REQUEST_SIZE_LIMIT_CODES = new Set([
    'LIMIT_FILE_SIZE',
    'LIMIT_FIELD_VALUE',
    'LIMIT_AGGREGATE_FILE_SIZE',
    'LIMIT_REQUEST_SIZE',
])

const getPublicError = (error) => {
    if (error instanceof ZodError) {
        const message = error.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join(' ')

        return { status: 400, message: message || 'Invalid request data.' }
    }

    const code = String(error?.code || '').toUpperCase()
    if (error instanceof UploadValidationError || code === 'INVALID_UPLOAD') {
        return { status: 400, message: 'Invalid file type or content.' }
    }

    if (REQUEST_SIZE_LIMIT_CODES.has(code)) {
        return { status: 413, message: 'Uploaded request exceeds the maximum allowed size.' }
    }

    if (code === 'INVALID_MULTIPART') {
        return { status: 400, message: 'Invalid multipart upload request.' }
    }

    if (code.startsWith('LIMIT_')) {
        return { status: 400, message: 'Invalid upload request.' }
    }

    return { status: 500, message: 'Failed to create request. Please try again later.' }
}

export const sendPublicRequestError = (res, error, requestType) => {
    const { status, message } = getPublicError(error)

    console.error('Public request creation failed', {
        event: 'public_request_creation_failed',
        requestType,
        errorCode: error?.code,
        errorName: error?.name,
    })

    return res.status(status).json({
        success: false,
        message,
    })
}
