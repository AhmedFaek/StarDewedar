import prisma from '../../utils/prisma.js'

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

export const updateUser = (id, data) => {
    return prisma.user.update({
        where: { id },
        data,
    })
}

export const findAllUsers = () => {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone_number: true,
            whatsapp_number: true,
            company_name: true,
            created_at: true,
        },
        orderBy: { created_at: 'desc' },
    })
}