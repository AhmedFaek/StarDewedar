import prisma from '../../utils/prisma.js';

export const createContactMessage = (data) => {
    return prisma.contactMessage.create({
        data,
    })
}

export const getAllMessages = () => {
    return prisma.contactMessage.findMany({
        orderBy: { created_at: 'desc' },
    })
}