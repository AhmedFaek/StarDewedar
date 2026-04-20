import prisma from '../../../../utils/prisma.js';
export const createImage = (data) => {
    return prisma.productImage.create({ data })
}