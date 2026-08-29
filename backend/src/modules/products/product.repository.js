import prisma from '../../utils/prisma.js';

export const createProduct = (data) => {
    return prisma.product.create({ data })
}

export const getAllProducts = ({ take = 100, skip = 0 } = {}) => {
    return prisma.product.findMany({
        take: Math.min(100, Math.max(1, Number(take) || 100)),
        skip: Math.max(0, Number(skip) || 0),
        include: {
            category: true,
            images: true,
            catalogs: true,
        },
        orderBy: { created_at: 'desc' },
    })
}

export const getProductById = (id) => {
    return prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            images: true,
            catalogs: true,
        },
    })
}

export const updateProduct = (id, data) => {
    return prisma.product.update({
        where: { id },
        data,
    })
}

export const deleteProduct = (id) => {
    return prisma.product.delete({
        where: { id },
    })
}