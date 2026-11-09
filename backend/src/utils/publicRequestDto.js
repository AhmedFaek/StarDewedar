const RAW_ATTACHMENT_URL_FIELDS = new Set([
    'file_url',
    'boq_file_url',
    'supporting_docs_urls',
])

const SAFE_ATTACHMENT_FIELDS = [
    'id',
    'original_filename',
    'mime_type',
    'file_size',
    'created_at',
]

const toSafeAttachment = (attachment) => {
    if (!attachment || typeof attachment !== 'object') return attachment
    const safeAttachment = Object.fromEntries(
        SAFE_ATTACHMENT_FIELDS
            .filter((key) => Object.hasOwn(attachment, key))
            .map((key) => [key, attachment[key]])
    )
    if (attachment.id) {
        safeAttachment.download_path = `/api/attachments/${attachment.id}/download`
    }
    return safeAttachment
}

const toSafeRequest = (request) => Object.fromEntries(
    Object.entries(request).filter(([key]) =>
        !RAW_ATTACHMENT_URL_FIELDS.has(key)
    )
)

export const toPublicRequest = (request) => {
    if (!request || typeof request !== 'object') return request
    const safeRequest = toSafeRequest(request)
    const publicRequest = Object.fromEntries(
        Object.entries(safeRequest).filter(([key]) =>
            key !== 'assets' &&
            key !== 'user_id' &&
            key !== 'archived_at' &&
            !key.startsWith('notification_')
        )
    )
    if (Array.isArray(request.attachments)) {
        publicRequest.attachments = request.attachments
            .filter((attachment) => attachment.status === undefined || attachment.status === 'ACTIVE')
            .map(toSafeAttachment)
    }
    return publicRequest
}

export const toAdminRequest = (request) => {
    if (!request || typeof request !== 'object') return request
    const { notification_lease_token, user_id, ...safeRequest } = request
    const adminRequest = toSafeRequest(safeRequest)
    delete adminRequest.assets
    if (Array.isArray(request.attachments)) {
        adminRequest.attachments = request.attachments
            .filter((attachment) => attachment.status === undefined || attachment.status === 'ACTIVE')
            .map(toSafeAttachment)
    }
    return adminRequest
}
