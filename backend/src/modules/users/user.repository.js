const prisma = require('../../utils/prisma');

const findUserByEmail = (email) => {
    return prisma.user.findUnique({
        where: { email },
    })
}

const findUserById = (id) => {
    return prisma.user.findUnique({
        where: { id },
    })
}

const createUser = (data) => {
    return prisma.user.create({
        data,
    })
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
};