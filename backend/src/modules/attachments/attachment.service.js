import cloudinary from '../../config/storage.js'
import * as userRepository from '../users/user.repository.js'
import * as attachmentRepository from './attachment.repository.js'
import { PERMISSIONS, roleHasPermission } from '../../utils/permissions.js'

const DOWNLOAD_EXPIRY_SECONDS = 5 * 60

const FORMAT_BY_MIME_TYPE = new Map([
    ['image/jpeg', { format: 'jpg', resourceType: 'image' }],
    ['image/png', { format: 'png', resourceType: 'image' }],
    ['application/pdf', { format: 'pdf', resourceType: 'raw' }],
    ['application/vnd.ms-excel', { format: 'xls', resourceType: 'raw' }],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', {
        format: 'xlsx',
        resourceType: 'raw',
    }],
    ['text/csv', { format: 'csv', resourceType: 'raw' }],
    ['application/csv', { format: 'csv', resourceType: 'raw' }],
])

const normalizeEmail = (email) =>
    typeof email === 'string' ? email.trim().toLowerCase() : ''

const forbiddenError = () => {
    const error = new Error('Forbidden')
    error.status = 403
    error.code = 'ATTACHMENT_FORBIDDEN'
    return error
}

const getCustomerEmail = async (user) => {
    if (user?.role !== 'customer') throw forbiddenError()

    const account = await userRepository.findUserById(user.userId)
    const email = normalizeEmail(account?.email)
    if (!account || account.email_verified !== true || !email) {
        throw forbiddenError()
    }

    return email
}

const getAuthorizedAttachment = async (id, user) => {
    const isAdmin = roleHasPermission(user?.role, PERMISSIONS.REQUESTS_MANAGE)
    const customerEmail = isAdmin ? null : await getCustomerEmail(user)
    const attachment = await attachmentRepository.findById(id)

    if (!attachment || attachment.status !== 'ACTIVE') return null

    if (!isAdmin) {
        const requestEmails = [
            attachment.quote_request?.email,
            attachment.visit_request?.email,
            attachment.boq_request?.email,
        ].map(normalizeEmail)

        if (!requestEmails.includes(customerEmail)) return null
    }

    return attachment
}

export const toAttachmentDto = (attachment) => ({
    id: attachment.id,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    file_size: attachment.file_size,
    created_at: attachment.created_at,
    download_path: `/api/attachments/${attachment.id}/download`,
})

export const getAttachmentMetadata = async (id, user) => {
    const attachment = await getAuthorizedAttachment(id, user)
    return attachment ? toAttachmentDto(attachment) : null
}

export const createSignedAttachmentDownloadUrl = (attachment, expiresAt) => {
    const format = FORMAT_BY_MIME_TYPE.get(attachment.mime_type)
    if (
        !format ||
        attachment.resource_type !== format.resourceType ||
        attachment.delivery_type !== 'authenticated' ||
        typeof attachment.public_id !== 'string' ||
        attachment.public_id.trim() === ''
    ) {
        const error = new Error('Attachment storage metadata is invalid')
        error.code = 'ATTACHMENT_STORAGE_METADATA_INVALID'
        throw error
    }

    return cloudinary.utils.private_download_url(
        attachment.public_id,
        format.format,
        {
            resource_type: attachment.resource_type,
            type: attachment.delivery_type,
            expires_at: expiresAt,
            attachment: true,
        }
    )
}

export const createAttachmentDownloadUrl = async (id, user) => {
    const attachment = await getAuthorizedAttachment(id, user)
    if (!attachment) return null

    const expiresAt = Math.floor(Date.now() / 1000) + DOWNLOAD_EXPIRY_SECONDS
    return createSignedAttachmentDownloadUrl(attachment, expiresAt)
}
