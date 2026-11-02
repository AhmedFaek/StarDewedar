import cloudinary from '../config/storage.js'
import {
    cleanupCloudinaryAssets,
    validateCloudinaryUploadResult,
} from './cloudinaryCleanup.js'

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png'])
const ALLOWED_MIME_TYPES = new Set([
    ...IMAGE_MIME_TYPES,
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
])
const DELIVERY_TYPE = 'authenticated'

const getResourceType = (file) =>
    IMAGE_MIME_TYPES.has(file.mimetype) ? 'image' : 'raw'

const getFileMetadata = (file) => {
    const fileSize = Number.isSafeInteger(file.size) && file.size > 0
        ? file.size
        : file.buffer?.length
    const originalFilename = typeof file.originalname === 'string'
        ? file.originalname.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim()
        : ''

    if (
        !originalFilename ||
        typeof file.mimetype !== 'string' ||
        !ALLOWED_MIME_TYPES.has(file.mimetype) ||
        !Buffer.isBuffer(file.buffer) ||
        !Number.isSafeInteger(fileSize) ||
        fileSize <= 0
    ) {
        const error = new Error('Uploaded file metadata is incomplete')
        error.code = 'CLOUDINARY_INVALID_UPLOAD_RESPONSE'
        throw error
    }

    return {
        original_filename: originalFilename,
        mime_type: file.mimetype,
        file_size: fileSize,
    }
}

export const toRequestAttachmentData = (file, result) => ({
    ...getFileMetadata(file),
    public_id: result.public_id,
    resource_type: result.resource_type,
    delivery_type: result.type,
    status: 'ACTIVE',
})

export const uploadRequestAttachment = (file, { folder }) => {
    getFileMetadata(file)
    const resourceType = getResourceType(file)

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                type: DELIVERY_TYPE,
                folder,
            },
            async (uploadError, uploadResult) => {
                if (uploadError) {
                    reject(uploadError)
                    return
                }

                let result
                try {
                    result = validateCloudinaryUploadResult(uploadResult)
                    if (
                        result.resource_type !== resourceType ||
                        result.type !== DELIVERY_TYPE
                    ) {
                        const error = new Error('Cloudinary returned unexpected attachment delivery metadata')
                        error.code = 'CLOUDINARY_INVALID_UPLOAD_RESPONSE'
                        throw error
                    }
                } catch (validationError) {
                    if (
                        typeof uploadResult?.public_id === 'string' &&
                        uploadResult.public_id.trim() !== '' &&
                        typeof uploadResult?.resource_type === 'string' &&
                        uploadResult.resource_type.trim() !== ''
                    ) {
                        await cleanupCloudinaryAssets([uploadResult], 'REQUEST_ATTACHMENT')
                    }
                    reject(validationError)
                    return
                }

                try {
                    resolve({
                        ...result,
                        attachment_data: toRequestAttachmentData(file, result),
                    })
                } catch (metadataError) {
                    await cleanupCloudinaryAssets([result], 'REQUEST_ATTACHMENT')
                    reject(metadataError)
                }
            }
        )
        stream.end(file.buffer)
    })
}
