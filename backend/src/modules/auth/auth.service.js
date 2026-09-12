import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../users/user.repository.js'
import * as authRepo from './auth.repository.js'
import { sendEmail } from '../../utils/mailer.js'
import { resetPasswordEmailTemplate } from '../../utils/resetPasswordEmail.template.js'
import { verificationEmailTemplate, getVerificationEmailAttachments } from '../../utils/verificationEmail.template.js'
import { validateCustomerEmail, normalizeEmail } from '../../utils/emailValidation.service.js'
import env from '../../config/env.js'
import { ROLES } from '../../utils/constants.js'

/* ─── Constants ──────────────────────────────────────────────────────────── */

const BCRYPT_SALT_ROUNDS = 12
const RESET_TOKEN_BYTES = 32
const RESET_TOKEN_EXPIRY_MINUTES = 15
const VERIFICATION_CODE_EXPIRY_MINUTES = 15
const RESEND_COOLDOWN_SECONDS = 60

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
 */
const hashResetToken = (rawToken) => {
    return crypto.createHash('sha256').update(rawToken).digest('hex')
}

/**
 * Hash a 6-digit verification code with SHA-256 for DB storage.
 */
const hashVerificationCode = (rawCode) => {
    return crypto.createHash('sha256').update(rawCode).digest('hex')
}

/**
 * Generate a cryptographically secure 6-digit numeric verification code.
 */
const generateVerificationCode = () => {
    return crypto.randomInt(100000, 1000000).toString()
}

/* ─── Public service methods ─────────────────────────────────────────────── */

/**
 * REGISTER — open to the public, always creates a "customer" account.
 * Requires email verification before login is permitted.
 */
export const register = async (data) => {
    // 1. Validate customer email (disposable check + MX DNS check)
    const emailValidation = await validateCustomerEmail(data.email)
    if (!emailValidation.isValid) {
        const err = new Error(emailValidation.error || 'Invalid email address')
        err.status = 400
        err.code = emailValidation.code
        throw err
    }

    const normalizedEmail = emailValidation.normalizedEmail

    // 2. Check for existing account with this email
    const existing = await userRepo.findUserByEmail(normalizedEmail)
    if (existing) throw new Error('Email already exists')

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)

    // 4. Generate 6-digit verification code & expiry (15 mins)
    const verificationCode = generateVerificationCode()
    const hashedCode = hashVerificationCode(verificationCode)
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000)

    // 5. Create unverified customer user
    const user = await userRepo.createUser({
        name: data.name,
        email: normalizedEmail,
        password: hashedPassword,
        whatsapp_number: data.whatsapp_number ?? null,
        phone_number: data.phone_number ?? null,
        company_name: data.company_name ?? null,
        role: ROLES.CUSTOMER,
        email_verified: false,
        email_verification_hash: hashedCode,
        email_verification_expires_at: expiresAt,
        email_verification_attempts: 0,
        email_verification_last_sent: new Date(),
    })

    // 6. Send branded verification email
    const html = verificationEmailTemplate({
        code: verificationCode,
        name: user.name,
        expiresInMinutes: VERIFICATION_CODE_EXPIRY_MINUTES,
    })

    try {
        await sendEmail({
            to: user.email,
            subject: 'Star Dewedar — Verify Your Email Address',
            html,
            attachments: getVerificationEmailAttachments(),
        })
    } catch (err) {
        console.error('[auth.service] Failed to send verification email on register:', err.message)
    }

    return {
        requiresEmailVerification: true,
        email: user.email,
        message: 'Registration successful. Please verify your email with the 6-digit code sent to your inbox.',
    }
}

/**
 * CREATE USER (admin-only) — creates any role with the supplied data.
 * Admin-created accounts are auto-verified.
 */
export const createUser = async (data) => {
    const normalizedEmail = normalizeEmail(data.email)
    const existing = await userRepo.findUserByEmail(normalizedEmail)
    if (existing) throw new Error('Email already exists')

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)

    const user = await userRepo.createUser({
        name: data.name,
        email: normalizedEmail,
        password: hashedPassword,
        role: data.role || ROLES.CUSTOMER,
        whatsapp_number: data.whatsapp_number ?? null,
        phone_number: data.phone_number ?? null,
        company_name: data.company_name ?? null,
        email_verified: true, // Admin-created accounts bypass verification
    })

    // Return without sensitive fields
    const { password, hashed_refresh_token, email_verification_hash, ...safeUser } = user
    return safeUser
}

/**
 * LOGIN — email + password, returns both tokens.
 * Blocks unverified customer accounts.
 */
export const login = async (email, password) => {
    const normalizedEmail = normalizeEmail(email)
    const user = await userRepo.findUserByEmail(normalizedEmail)
    if (!user) throw new Error('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error('Invalid credentials')

    // Block unverified customer accounts
    if (user.role === ROLES.CUSTOMER && !user.email_verified) {
        const err = new Error('Please verify your email address before logging in.')
        err.status = 403
        err.requiresEmailVerification = true
        err.email = user.email
        throw err
    }

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
 * VERIFY EMAIL — verifies 6-digit code, marks email_verified = true,
 * and issues authentication tokens.
 */
export const verifyEmail = async (email, code) => {
    const normalizedEmail = normalizeEmail(email)
    const user = await userRepo.findUserByEmail(normalizedEmail)
    if (!user) {
        const err = new Error('User not found')
        err.status = 404
        throw err
    }

    // If already verified, allow login
    if (user.email_verified) {
        const tokens = generateTokens(user)
        await storeHashedRefreshToken(user.id, tokens.refreshToken)
        return {
            message: 'Email is already verified.',
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

    // Rate limiting attempts (max 5 failed attempts)
    if (user.email_verification_attempts >= 5) {
        const err = new Error('Too many failed attempts. Please request a new verification code.')
        err.status = 429
        err.code = 'MAX_VERIFICATION_ATTEMPTS_EXCEEDED'
        throw err
    }

    // Check expiration
    if (!user.email_verification_expires_at || new Date() > new Date(user.email_verification_expires_at)) {
        const err = new Error('Verification code has expired. Please request a new code.')
        err.status = 400
        err.code = 'VERIFICATION_CODE_EXPIRED'
        throw err
    }

    // Compare hash
    const hashedCode = hashVerificationCode(code.trim())
    if (!user.email_verification_hash || user.email_verification_hash !== hashedCode) {
        await authRepo.incrementVerificationAttempts(user.id)
        const remaining = Math.max(0, 4 - user.email_verification_attempts)
        const err = new Error(
            remaining > 0
                ? `Invalid verification code. ${remaining} attempt(s) remaining.`
                : 'Invalid verification code. Maximum attempts reached. Please request a new code.'
        )
        err.status = 400
        err.code = 'INVALID_VERIFICATION_CODE'
        err.remaining = remaining
        throw err
    }

    // Code matches! Clear fields and mark verified
    await authRepo.clearVerificationFields(user.id)

    // Issue tokens for auto-login
    const tokens = generateTokens(user)
    await storeHashedRefreshToken(user.id, tokens.refreshToken)

    return {
        message: 'Email verified successfully.',
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
 * RESEND VERIFICATION CODE — generates a fresh code and resets attempts.
 * Enforces a 60-second cooldown between resends.
 */
export const resendVerificationCode = async (email) => {
    const normalizedEmail = normalizeEmail(email)
    const user = await userRepo.findUserByEmail(normalizedEmail)

    const genericSuccess = {
        message: 'If an unverified account exists, a new verification code has been sent.',
    }

    if (!user) {
        return genericSuccess
    }

    if (user.email_verified) {
        return {
            message: 'This email is already verified. You can log in directly.',
            alreadyVerified: true,
        }
    }

    // 60-second cooldown check
    if (user.email_verification_last_sent) {
        const elapsedSeconds = Math.floor(
            (Date.now() - new Date(user.email_verification_last_sent).getTime()) / 1000
        )
        if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
            const waitSeconds = RESEND_COOLDOWN_SECONDS - elapsedSeconds
            const err = new Error(`Please wait ${waitSeconds} seconds before requesting a new code.`)
            err.status = 429
            err.code = 'RESEND_COOLDOWN'
            err.retryAfter = waitSeconds
            throw err
        }
    }

    // Generate new code
    const verificationCode = generateVerificationCode()
    const hashedCode = hashVerificationCode(verificationCode)
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000)

    await authRepo.saveVerificationCode(user.id, {
        hashedCode,
        expiresAt,
        attempts: 0,
        lastSent: new Date(),
    })

    // Send email
    const html = verificationEmailTemplate({
        code: verificationCode,
        name: user.name,
        expiresInMinutes: VERIFICATION_CODE_EXPIRY_MINUTES,
    })

    try {
        await sendEmail({
            to: user.email,
            subject: 'Star Dewedar — Email Verification Code',
            html,
            attachments: getVerificationEmailAttachments(),
        })
    } catch (err) {
        console.error('[auth.service] Failed to send resend-verification email:', err.message)
    }

    return {
        message: 'A new 6-digit verification code has been sent to your email.',
        email: user.email,
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
 */
export const forgotPassword = async (email) => {
    const genericMessage = 'If an account exists, a reset link has been sent.'

    const normalizedEmail = normalizeEmail(email)
    const user = await userRepo.findUserByEmail(normalizedEmail)

    if (!user) {
        return { message: genericMessage }
    }

    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex')
    const hashedToken = hashResetToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)

    await authRepo.saveResetToken(user.id, hashedToken, expiresAt)

    const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`
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
        console.error('Failed to send password reset email:', err.message)
    }

    return { message: genericMessage }
}

/**
 * RESET PASSWORD — validates the incoming raw token against the stored hash,
 * checks expiration, updates the password, and invalidates all sessions.
 */
export const resetPassword = async (rawToken, newPassword) => {
    const hashedToken = hashResetToken(rawToken)

    const user = await authRepo.findUserByResetToken(hashedToken)
    if (!user) {
        throw new Error('Invalid or expired reset token')
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)
    await authRepo.resetPassword(user.id, hashedPassword)

    return { message: 'Password has been reset successfully' }
}

/**
 * CHANGE PASSWORD — authenticated flow where the user provides their current
 * password and a new one. All sessions are invalidated afterwards.
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userRepo.findUserById(userId)
    if (!user) {
        throw new Error('User not found')
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
        throw new Error('Current password is incorrect')
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)
    await authRepo.changePassword(user.id, hashedPassword)

    return { message: 'Password changed successfully' }
}