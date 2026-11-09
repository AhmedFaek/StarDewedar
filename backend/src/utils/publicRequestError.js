import { ZodError } from 'zod'
import { UploadValidationError } from './uploadValidation.js'

const REQUEST_SIZE_LIMIT_CODES = new Set([
    'LIMIT_FILE_SIZE',
    'LIMIT_FIELD_VALUE',
    'LIMIT_AGGREGATE_FILE_SIZE',
    'LIMIT_REQUEST_SIZE',
])
const EMAIL_VALIDATION_CODES = new Set([
    'INVALID_EMAIL_FORMAT',
    'INVALID_EMAIL_DOMAIN',
    'DISPOSABLE_EMAIL_NOT_ALLOWED',
])

const getPublicError = (error) => {
    const code = String(error?.code || '').toUpperCase()
    if (EMAIL_VALIDATION_CODES.has(code)) {
        return { status: 400, message: error.message, code }
    }

    if (error instanceof ZodError) {
        const message = error.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join(' ')

        return { status: 400, message: message || 'Invalid request data.' }
    }

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
    const { status, message, code } = getPublicError(error)

    console.error('Public request creation failed', {
        event: 'public_request_creation_failed',
        requestType,
        errorCode: error?.code,
        errorName: error?.name,
    })

    const response = {
        success: false,
        message,
    }
    if (code) response.code = code

    return res.status(status).json(response)
}
