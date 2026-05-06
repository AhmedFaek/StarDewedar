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

// ── Saved Products ────────────────────────────────────────────────────────────

export const getSavedProducts = (userId) => {
    return prisma.savedProduct.findMany({
        where: { user_id: userId },
        include: {
            product: {
                include: {
                    images: true,
                    catalogs: true,
                    category: true,
                },
            },
        },
        orderBy: { saved_at: 'desc' },
    })
}

export const saveProduct = (userId, productId) => {
    return prisma.savedProduct.create({
        data: { user_id: userId, product_id: productId },
        include: { product: true },
    })
}

export const unsaveProduct = (userId, productId) => {
    return prisma.savedProduct.delete({
        where: {
            user_id_product_id: { user_id: userId, product_id: productId },
        },
    })
}

export const isProductSaved = (userId, productId) => {
    return prisma.savedProduct.findUnique({
        where: {
            user_id_product_id: { user_id: userId, product_id: productId },
        },
    })
}