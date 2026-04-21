import prisma from '../../../../utils/prisma.js';

export const createMany = (data) => {
    return prisma.projectImage.createMany({
        data,
    })
}