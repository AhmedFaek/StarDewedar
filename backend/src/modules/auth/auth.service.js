const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userRepo = require('../users/user.repository')
const env = require('../../config/env')

/* Generate Tokens */
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        env.jwtSecret,
        { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
        { userId: user.id },
        env.jwtRefreshSecret,
        { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
}

/* Create User (ADMIN ONLY) */
const createUser = async (data) => {
    const existing = await userRepo.findUserByEmail(data.email)

    if (existing) {
        throw new Error('Email already exists')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    return await userRepo.createUser({
        ...data,
        password: hashedPassword,
    })
}

/* Login */
const login = async (email, password) => {
    const user = await userRepo.findUserByEmail(email)

    if (!user) throw new Error('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) throw new Error('Invalid credentials')

    return generateTokens(user)
}

/* Refresh Token */
const refreshToken = (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret)

        const accessToken = jwt.sign(
            { userId: decoded.userId },
            env.jwtSecret,
            { expiresIn: '15m' }
        )

        return { accessToken }
    } catch {
        throw new Error('Invalid refresh token')
    }
}

module.exports = { createUser, login, refreshToken }