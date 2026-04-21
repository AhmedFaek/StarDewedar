import prisma from '../../utils/prisma.js';

export const create = (data) => {
    return prisma.project.create({ data })
}

export const findAll = () => {
    return prisma.project.findMany({
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