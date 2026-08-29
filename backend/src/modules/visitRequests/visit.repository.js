import prisma from '../../utils/prisma.js'

export const create = (data) => {
    return prisma.visitRequest.create({
        data,
    })
}

export const findAll = ({ take = 100, skip = 0 } = {}) => {
    return prisma.visitRequest.findMany({
        take: Math.min(100, Math.max(1, Number(take) || 100)),
        skip: Math.max(0, Number(skip) || 0),
        orderBy: { created_at: 'desc' },
    })
}

export const findById = (id) => {
    return prisma.visitRequest.findUnique({
        where: { id },
    })
}

export const findByEmail = (email) => {
    return prisma.visitRequest.findMany({
        where: { email },
        orderBy: { created_at: 'desc' },
    })
}

export const update = (id, data) => {
    return prisma.visitRequest.update({
        where: { id },
        data,
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
        orderBy: { created_at: 'desc' },
    })
}
