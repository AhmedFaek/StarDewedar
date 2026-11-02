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

const archivedWhere = (archived) =>
    archived === undefined
        ? {}
        : { archived_at: archived ? { not: null } : null }

export const create = (data, attachments = []) =>
    prisma.bOQRequest.create({
        data: {
            ...data,
            attachments: { create: attachments },
        },
        include: requestReadRelations,
    })

export const findAll = ({ take = 50, skip = 0, archived = false } = {}) =>
    prisma.bOQRequest.findMany({
        where: archivedWhere(archived),
        orderBy: { created_at: 'desc' },
        take,
        skip,
        include: requestReadRelations,
    })

export const findById = (id) =>
    prisma.bOQRequest.findUnique({
        where: { id },
        include: requestReadRelations,
    })

export const findByEmail = (email, archived) =>
    prisma.bOQRequest.findMany({
        where: { email, ...archivedWhere(archived) },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })

export const findByStatus = (status, archived = false) =>
    prisma.bOQRequest.findMany({
        where: { status: { in: [status, status.toUpperCase()] }, ...archivedWhere(archived) },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })

export const update = (id, data) =>
    prisma.bOQRequest.update({
        where: { id },
        data,
        include: requestReadRelations,
    })
