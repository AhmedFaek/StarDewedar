import prisma from '../../utils/prisma.js'

export const findById = (id) =>
    prisma.attachment.findUnique({
        where: { id },
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
            created_at: true,
            quote_request: { select: { user_id: true } },
            visit_request: { select: { user_id: true } },
            boq_request: { select: { user_id: true } },
        },
    })
