import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../users/user.repository.js'
import env from '../../config/env.js'
import { ROLES } from '../../utils/constants.js'

/* ─── Token helpers ──────────────────────────────────────────────────────── */

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role, name: user.name },
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

/**
 * Hash a raw refresh token and persist it on the User row.
 * We use bcrypt (cost 10) so even a DB breach can't replay the token.
 */
const storeHashedRefreshToken = async (userId, rawRefreshToken) => {
    const hashed = await bcrypt.hash(rawRefreshToken, 10)
    await userRepo.updateUser(userId, { hashed_refresh_token: hashed })
}

/* ─── Public service methods ─────────────────────────────────────────────── */

/**
 * REGISTER — open to the public, always creates a "customer" account.
 */
export const register = async (data) => {
    const existing = await userRepo.findUserByEmail(data.email)
    if (existing) throw new Error('Email already exists')

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await userRepo.createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        whatsapp_number: data.whatsapp_number ?? null,
        phone_number: data.phone_number ?? null,
        company_name: data.company_name ?? null,
        role: ROLES.CUSTOMER,
    })

    const tokens = generateTokens(user)
    await storeHashedRefreshToken(user.id, tokens.refreshToken)

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone_number: user.phone_number,
            whatsapp_number: user.whatsapp_number,
            company_name: user.company_name,
        },
    }
}

/**
 * CREATE USER (admin-only) — creates any role with the supplied data.
 */
export const createUser = async (data) => {
    const existing = await userRepo.findUserByEmail(data.email)
    if (existing) throw new Error('Email already exists')

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await userRepo.createUser({
        ...data,
        password: hashedPassword,
    })

    // Return without sensitive fields
    const { password, hashed_refresh_token, ...safeUser } = user
    return safeUser
}

/**
 * LOGIN — email + password, returns both tokens.
 * Hashed refresh token is saved in the DB so only one active session is valid.
 */
export const login = async (email, password) => {
    const user = await userRepo.findUserByEmail(email)
    if (!user) throw new Error('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error('Invalid credentials')

    const tokens = generateTokens(user)
    await storeHashedRefreshToken(user.id, tokens.refreshToken)

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone_number: user.phone_number,
            whatsapp_number: user.whatsapp_number,
            company_name: user.company_name,
        },
    }
}

/**
 * REFRESH — verifies the raw token against the bcrypt hash stored in the DB.
 * Issues a new access token (and rotates the refresh token).
 */
export const refreshToken = async (rawRefreshToken) => {
    let decoded
    try {
        decoded = jwt.verify(rawRefreshToken, env.jwtRefreshSecret)
    } catch {
        throw new Error('Invalid refresh token')
    }

    const user = await userRepo.findUserById(decoded.userId)
    if (!user || !user.hashed_refresh_token) throw new Error('Invalid refresh token')

    // Validate the raw token against the stored hash
    const isValid = await bcrypt.compare(rawRefreshToken, user.hashed_refresh_token)
    if (!isValid) throw new Error('Invalid refresh token')

    // Rotate — generate brand-new pair and store the new hash
    const tokens = generateTokens(user)
    await storeHashedRefreshToken(user.id, tokens.refreshToken)

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    }
}

/**
 * LOGOUT — clears the stored hashed refresh token so the token can never
 * be used again, even if someone has a copy.
 */
export const logout = async (userId) => {
    await userRepo.updateUser(userId, { hashed_refresh_token: null })
    return { message: 'Logged out successfully' }
}