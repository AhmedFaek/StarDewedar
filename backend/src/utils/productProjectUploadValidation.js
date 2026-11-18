import path from 'node:path'
import { UploadValidationError, validateUploadedFile } from './uploadValidation.js'

const MiB = 1024 * 1024
const MAX_FILE_BYTES = 10 * MiB

const failUpload = (message = 'Invalid file type or content.') => {
    throw new UploadValidationError(message)
}

const ensureCollection = (files, field, maxCount) => {
    const values = files?.[field] ?? []
    if (!Array.isArray(values) || values.length > maxCount) failUpload()
    return values
}

const validateFieldFile = async (file, field, validateFile) => {
    if (!file || !Buffer.isBuffer(file.buffer)) failUpload()
    if (file.buffer.length > MAX_FILE_BYTES) {
        const error = new Error('Uploaded file exceeds the maximum allowed size.')
        error.code = 'LIMIT_FILE_SIZE'
        error.status = 413
        throw error
    }

    const extension = path.extname(file.originalname || '').toLowerCase()
    if (field === 'images') {
        if (
            !['.jpg', '.jpeg', '.png'].includes(extension) ||
            !['image/jpeg', 'image/png'].includes(file.mimetype)
        ) {
            failUpload()
        }
    } else if (extension !== '.pdf' || file.mimetype !== 'application/pdf') {
        failUpload()
    }

    await validateFile(file)
}

const validateFilesByField = async (files, fields, validateFile) => {
    if (files == null) return true
    if (typeof files !== 'object' || Array.isArray(files)) failUpload()
    if (Object.keys(files).some((field) => !fields.includes(field))) failUpload()

    for (const [field, maxCount] of Object.entries({
        images: fields.includes('images') ? (fields.includes('catalog') ? 5 : 10) : 0,
        catalog: fields.includes('catalog') ? 1 : 0,
    })) {
        if (maxCount === 0) continue
        const fieldFiles = ensureCollection(files, field, maxCount)
        for (const file of fieldFiles) await validateFieldFile(file, field, validateFile)
    }
    return true
}

export const validateProductUploadFiles = (files, { validateFile = validateUploadedFile } = {}) => (
    validateFilesByField(files, ['images', 'catalog'], validateFile)
)

export const validateProjectUploadFiles = (files, { validateFile = validateUploadedFile } = {}) => (
    validateFilesByField(files, ['images'], validateFile)
)
