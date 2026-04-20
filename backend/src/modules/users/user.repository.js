import prisma from '../../utils/prisma.js';

export const findUserByEmail = (email) => {
    return prisma.user.findUnique({
        where: { email },
    })
}

export const findUserById = (id) => {
    return prisma.user.findUnique({
        where: { id },
    })
}

export const createUser = (data) => {
    return prisma.user.create({
        data,
    })
}