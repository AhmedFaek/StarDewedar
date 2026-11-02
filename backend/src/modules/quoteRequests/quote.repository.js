import prisma from '../../utils/prisma.js'

const requestReadRelations = {
    product: true,
    attachments: {
        where: { status: 'ACTIVE' },
        select: {
            id: true,
            original_filename: true,
            mime_type: true,
            file_size: true,
            created_at: true,
            status: true,
        },
    },
}

const archivedWhere = (archived) =>
    archived === undefined
        ? {}
        : { archived_at: archived ? { not: null } : null }

export const create = (data, attachments = []) => {
    return prisma.$transaction(async (transaction) => {
        let snapshots = {
            product_name_en_snapshot: null,
            product_name_ar_snapshot: null,
        }

        if (data.product_id) {
            const product = await transaction.product.findUnique({
                where: { id: data.product_id },
                select: {
                    name_en: true,
                    name_ar: true,
                },
            })

            if (!product) {
                throw new Error('Requested product is no longer available')
            }

            snapshots = {
                product_name_en_snapshot: product.name_en,
                product_name_ar_snapshot: product.name_ar,
            }
        }

        return transaction.quoteRequest.create({
            data: {
                ...data,
                ...snapshots,
                ...(attachments.length > 0
                    ? { attachments: { create: attachments } }
                    : {}),
            },
            include: requestReadRelations,
        })
    })
}

export const findAll = ({ take = 100, skip = 0, archived = false } = {}) => {
    return prisma.quoteRequest.findMany({
        where: archivedWhere(archived),
        take: Math.min(100, Math.max(1, Number(take) || 100)),
        skip: Math.max(0, Number(skip) || 0),
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })
}

export const findById = (id) => {
    return prisma.quoteRequest.findUnique({
        where: { id },
        include: requestReadRelations,
    })
}

export const findByEmail = (email, archived) => {
    return prisma.quoteRequest.findMany({
        where: { email, ...archivedWhere(archived) },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })
}

export const update = (id, data) => {
    return prisma.quoteRequest.update({
        where: { id },
        data,
        include: requestReadRelations,
    })
}

export const findByStatus = (status, archived = false) => {
    return prisma.quoteRequest.findMany({
        where: { status: { in: [status, status.toUpperCase()] }, ...archivedWhere(archived) },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })
}
