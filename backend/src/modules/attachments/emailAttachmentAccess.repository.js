import prisma from '../../utils/prisma.js'

export const findByTokenHash = (tokenHash) =>
    prisma.emailAttachmentAccessToken.findUnique({
        where: { token_hash: tokenHash },
        select: {
            token_hash: true,
            expires_at: true,
            revoked_at: true,
            notification_attempt: {
                select: {
                    status: true,
                    request_type: true,
                    request_id: true,
                },
            },
            attachment: {
                select: {
                    id: true,
                    quote_request_id: true,
                    visit_request_id: true,
                    boq_request_id: true,
                    original_filename: true,
                    mime_type: true,
                    file_size: true,
                    public_id: true,
                    resource_type: true,
                    delivery_type: true,
                    status: true,
                },
            },
        },
    })
