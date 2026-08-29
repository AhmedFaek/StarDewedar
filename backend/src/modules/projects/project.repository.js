import prisma from '../../utils/prisma.js';

export const create = (data) => {
    return prisma.project.create({ data })
}

export const findAll = ({ take = 100, skip = 0 } = {}) => {
    return prisma.project.findMany({
        take: Math.min(100, Math.max(1, Number(take) || 100)),
        skip: Math.max(0, Number(skip) || 0),
        include: {
            images: true,
            category: true,
        },
        orderBy: { created_at: 'desc' }
    })
}

export const findById = (id) => {
    return prisma.project.findUnique({
        where: { id },
        include: {
            images: true,
            category: true,
        },
    })
}

export const update = (id, data) => {
    return prisma.project.update({
        where: { id },
        data,
    })
}

export const remove = (id) => {
    return prisma.project.delete({
        where: { id },
    })
}