import prisma from '../../../config/db.js'

export const createCatalog = (data) => {
    return prisma.productCatalog.create({ data })
}