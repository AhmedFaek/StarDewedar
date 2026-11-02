import prisma from '../../utils/prisma.js'

const requestReadRelations = {
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

export const create = (data, attachments = []) => {
    return prisma.visitRequest.create({
        data: {
            ...data,
            ...(attachments.length > 0
                ? { attachments: { create: attachments } }
                : {}),
        },
        include: requestReadRelations,
    })
}

export const findAll = ({ take = 100, skip = 0 } = {}) => {
    return prisma.visitRequest.findMany({
        take: Math.min(100, Math.max(1, Number(take) || 100)),
        skip: Math.max(0, Number(skip) || 0),
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })
}

export const findById = (id) => {
    return prisma.visitRequest.findUnique({
        where: { id },
        include: requestReadRelations,
    })
}

export const findByEmail = (email) => {
    return prisma.visitRequest.findMany({
        where: { email },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })
}

export const update = (id, data) => {
    return prisma.visitRequest.update({
        where: { id },
        data,
        include: requestReadRelations,
    })
}

export const remove = (id) => {
    return prisma.visitRequest.delete({
        where: { id },
    })
}

export const findByStatus = (status) => {
    return prisma.visitRequest.findMany({
        where: { status },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })
}
