import prisma from '../../utils/prisma.js'

export const create = (data) =>
    prisma.bOQRequest.create({ data })

export const findAll = ({ take = 50, skip = 0 } = {}) =>
    prisma.bOQRequest.findMany({
        orderBy: { created_at: 'desc' },
        take,
        skip,
    })

export const findById = (id) =>
    prisma.bOQRequest.findUnique({ where: { id } })

export const findByEmail = (email) =>
    prisma.bOQRequest.findMany({
        where: { email },
        orderBy: { created_at: 'desc' },
    })

export const findByStatus = (status) =>
    prisma.bOQRequest.findMany({
        where: { status },
        orderBy: { created_at: 'desc' },
    })

export const update = (id, data) =>
    prisma.bOQRequest.update({ where: { id }, data })

export const remove = (id) =>
    prisma.bOQRequest.delete({ where: { id } })
