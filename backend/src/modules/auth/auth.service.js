import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../users/user.repository.js'
import * as authRepo from './auth.repository.js'
import { sendEmail } from '../../utils/mailer.js'
import { resetPasswordEmailTemplate } from '../../utils/resetPasswordEmail.template.js'
import env from '../../config/env.js'
import { ROLES } from '../../utils/constants.js'

/* ─── Constants ──────────────────────────────────────────────────────────── */

const BCRYPT_SALT_ROUNDS = 12
const RESET_TOKEN_BYTES = 32
const RESET_TOKEN_EXPIRY_MINUTES = 15

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

/**
 * Hash a raw reset token with SHA-256 for DB storage.
 * SHA-256 is appropriate here because the token is already high-entropy
 * (crypto.randomBytes), so a fast hash is sufficient and keeps lookups O(1).
 */
const hashResetToken = (rawToken) => {
    return crypto.createHash('sha256').update(rawToken).digest('hex')
}

/* ─── Public service methods ─────────────────────────────────────────────── */

/**
 * REGISTER — open to the public, always creates a "customer" account.
 */
export const register = async (data) => {
    const existing = await userRepo.findUserByEmail(data.email)
    if (existing) throw new Error('Email already exists')

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)

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

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)

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

/* ─── Password reset / change ────────────────────────────────────────────── */

/**
 * FORGOT PASSWORD — generates a secure reset token, hashes it with SHA-256,
 * stores the hash in the DB, and emails the raw token to the user.
 *
 * SECURITY: Always returns the same generic message regardless of whether
 * the email exists, to prevent user enumeration.
 */
export const forgotPassword = async (email) => {
    const genericMessage = 'If an account exists, a reset link has been sent.'

    const user = await userRepo.findUserByEmail(email)

    if (!user) {
        // Do NOT reveal that the email doesn't exist
        return { message: genericMessage }
    }

    // 1. Generate a cryptographically secure random token
    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex')

    // 2. Hash it with SHA-256 before saving to DB
    const hashedToken = hashResetToken(rawToken)

    // 3. Set expiration
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)

    // 4. Persist hashed token + expiration
    await authRepo.saveResetToken(user.id, hashedToken, expiresAt)

    // 5. Build the reset URL with the RAW (unhashed) token
    const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`

    // 6. Send the email
    const html = resetPasswordEmailTemplate({
        resetUrl,
        expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    })

    try {
        await sendEmail({
            to: user.email,
            subject: 'Star Dewedar — Password Reset',
            html,
        })
    } catch (err) {
        // Log the error but DO NOT expose it to the client
        console.error('Failed to send password reset email:', err.message)
    }

    return { message: genericMessage }
}

/**
 * RESET PASSWORD — validates the incoming raw token against the stored hash,
 * checks expiration, updates the password, and invalidates all sessions.
 */
export const resetPassword = async (rawToken, newPassword) => {
    // 1. Hash the incoming raw token with SHA-256
    const hashedToken = hashResetToken(rawToken)

    // 2. Look up user by hashed token (only if not expired)
    const user = await authRepo.findUserByResetToken(hashedToken)
    if (!user) {
        throw new Error('Invalid or expired reset token')
    }

    // 3. Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

    // 4. Update password, clear reset token, invalidate all sessions
    await authRepo.resetPassword(user.id, hashedPassword)

    return { message: 'Password has been reset successfully' }
}

/**
 * CHANGE PASSWORD — authenticated flow where the user provides their current
 * password and a new one. All sessions are invalidated afterwards.
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
    // 1. Fetch the user
    const user = await userRepo.findUserById(userId)
    if (!user) {
        throw new Error('User not found')
    }

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
        throw new Error('Current password is incorrect')
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

    // 4. Update password and invalidate all sessions
    await authRepo.changePassword(user.id, hashedPassword)

    return { message: 'Password changed successfully' }
}