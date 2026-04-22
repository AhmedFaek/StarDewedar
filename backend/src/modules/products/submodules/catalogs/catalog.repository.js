import prisma from '../../../../utils/prisma.js';

export const createCatalog = (data) => {
    return prisma.productCatalog.create({ data })
}

export const getAllCatalogsByProductId = (productId) => {
    return prisma.productCatalog.findMany({
        where: { product_id: productId },
    })
}