import prisma from '../../utils/prisma.js'

export const create = (data) => {
    return prisma.quoteRequest.create({
        data,
        include: {
            product: true,
        },
    })
}

export const findAll = () => {
    return prisma.quoteRequest.findMany({
        include: {
            product: true,
        },
        orderBy: { created_at: 'desc' },
    })
}

export const findById = (id) => {
    return prisma.quoteRequest.findUnique({
        where: { id },
        include: {
            product: true,
        },
    })
}

export const findByEmail = (email) => {
    return prisma.quoteRequest.findMany({
        where: { email },
        include: {
            product: true,
        },
        orderBy: { created_at: 'desc' },
    })
}

export const update = (id, data) => {
    return prisma.quoteRequest.update({
        where: { id },
        data,
        include: {
            product: true,
        },
    })
}

export const remove = (id) => {
    return prisma.quoteRequest.delete({
        where: { id },
    })
}

export const findByStatus = (status) => {
    return prisma.quoteRequest.findMany({
        where: { status },
        include: {
            product: true,
        },
        orderBy: { created_at: 'desc' },
    })
}
