import prisma from '../../utils/prisma.js';

export const createContactMessage = (data) => {
    return prisma.contactMessage.create({
        data,
    })
}

export const getAllMessages = ({ take = 100, skip = 0 } = {}) => {
    return prisma.contactMessage.findMany({
        take: Math.min(100, Math.max(1, Number(take) || 100)),
        skip: Math.max(0, Number(skip) || 0),
        orderBy: { created_at: 'desc' },
    })
}