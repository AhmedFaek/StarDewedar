import prisma from '../../../../utils/prisma.js';

export const createCatalog = (data) => {
    return prisma.productCatalog.create({ data })
}