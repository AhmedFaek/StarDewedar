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

export const create = (data, attachments = []) =>
    prisma.bOQRequest.create({
        data: {
            ...data,
            attachments: { create: attachments },
        },
        include: requestReadRelations,
    })

export const findAll = ({ take = 50, skip = 0 } = {}) =>
    prisma.bOQRequest.findMany({
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

export const findByEmail = (email) =>
    prisma.bOQRequest.findMany({
        where: { email },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })

export const findByStatus = (status) =>
    prisma.bOQRequest.findMany({
        where: { status },
        include: requestReadRelations,
        orderBy: { created_at: 'desc' },
    })

export const update = (id, data) =>
    prisma.bOQRequest.update({
        where: { id },
        data,
        include: requestReadRelations,
    })

export const remove = (id) =>
    prisma.bOQRequest.delete({ where: { id } })
