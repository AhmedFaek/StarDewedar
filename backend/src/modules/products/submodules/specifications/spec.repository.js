import prisma from '../../../config/db.js'

export const createMany = (data) => {
    return prisma.productSpecification.createMany({
        data,
    })
}