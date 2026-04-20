import prisma from '../../utils/prisma.js';

export const createProduct = (data) => {
    return prisma.product.create({ data })
}

export const getAllProducts = () => {
    return prisma.product.findMany({
        include: {
            category: true,
            images: true,
            catalogs: true,
            specifications: true,
        },
        orderBy: { created_at: 'desc' },
    })
}

export const getProductById = (id) => {
    return prisma.product.findUnique({
        where: { id },
        include: {
            images: true,
            catalogs: true,
            specifications: true,
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