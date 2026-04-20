import prisma from '../../../config/db.js'

export const createImage = (data) => {
    return prisma.productImage.create({ data })
}