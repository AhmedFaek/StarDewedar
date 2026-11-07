import prisma from '../../utils/prisma.js'

/* ─── Password reset token operations ────────────────────────────────────── */

export const saveResetTokenIfCooldownElapsed = (userId, hashedToken, expiresAt, cooldownExpiryCutoff) => {
    return prisma.user.updateMany({
        where: {
            id: userId,
            OR: [
                { reset_password_expires: null },
                { reset_password_expires: { lte: cooldownExpiryCutoff } },
            ],
        },
        data: {
            reset_password_token: hashedToken,
            reset_password_expires: expiresAt,
        },
    })
}

/**
 * Store a SHA-256-hashed reset token and its expiration on the user row.
 */
export const saveResetToken = (userId, hashedToken, expiresAt) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            reset_password_token: hashedToken,
            reset_password_expires: expiresAt,
        },
    })
}

/**
 * Find a user whose hashed reset token matches AND whose token has not expired.
 */
export const findUserByResetToken = (hashedToken) => {
    return prisma.user.findFirst({
        where: {
            reset_password_token: hashedToken,
            reset_password_expires: { gt: new Date() },
        },
    })
}

/**
 * Atomically redeem the reset token, update the password, and invalidate sessions.
 */
export const resetPassword = (userId, hashedToken, hashedPassword, { verifyEmail = false } = {}) => {
    const data = {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        hashed_refresh_token: null,
    }

    if (verifyEmail) {
        Object.assign(data, {
            email_verified: true,
            email_verification_hash: null,
            email_verification_expires_at: null,
            email_verification_attempts: 0,
            email_verification_last_sent: null,
        })
    }

    return prisma.user.updateMany({
        where: {
            id: userId,
            reset_password_token: hashedToken,
            reset_password_expires: { gt: new Date() },
        },
        data,
    })
}

/**
 * Update the user's password and invalidate all sessions.
 * Used by the authenticated change-password flow.
 */
export const changePassword = (userId, hashedPassword) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            hashed_refresh_token: null,
        },
    })
}

/* ─── Email verification operations ─────────────────────────────────────── */

/**
 * Store an HMAC-hashed verification code, expiration, and update last sent timestamp.
 * Targets only unverified users.
 */
export const saveVerificationCode = (userId, { hashedCode, expiresAt, attempts = 0, lastSent = new Date() }) => {
    return prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
        },
        data: {
            email_verification_hash: hashedCode,
            email_verification_expires_at: expiresAt,
            email_verification_attempts: attempts,
            email_verification_last_sent: lastSent,
        },
    })
}

/**
 * Refresh registration details and verification state only while the account
 * remains unverified, its current code is missing or expired, and cooldown has elapsed.
 */
export const refreshUnverifiedRegistration = (userId, data, now = new Date(), cooldownSeconds = 60) => {
    const cooldownCutoff = new Date(now.getTime() - cooldownSeconds * 1000)

    return prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
            AND: [
                {
                    OR: [
                        { email_verification_hash: null },
                        { email_verification_expires_at: null },
                        { email_verification_expires_at: { lte: now } },
                    ],
                },
                {
                    OR: [
                        { email_verification_last_sent: null },
                        { email_verification_last_sent: { lte: cooldownCutoff } },
                    ],
                },
            ],
        },
        data,
    })
}

/**
 * Atomically verify and consume the verification code.
 * Succeeds only if:
 *   - user.id = userId
 *   - email_verified = false
 *   - email_verification_hash = hashedCode
 *   - email_verification_expires_at > now
 *
 * Returns affected rows count (1 = success / consumed, 0 = rejected / already consumed).
 */
export const consumeVerificationCode = async (userId, hashedCode, now = new Date()) => {
    const result = await prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
            email_verification_hash: hashedCode,
            email_verification_expires_at: { gt: now },
        },
        data: {
            email_verified: true,
            email_verification_hash: null,
            email_verification_expires_at: null,
            email_verification_attempts: 0,
            email_verification_last_sent: null,
        },
    })
    return result.count
}

/**
 * Atomically increment failed verification attempts if under maxAttempts limit.
 * PostgreSQL row locking guarantees that attempts never exceed maxAttempts.
 *
 * Returns { allowed: boolean, count: number, attempts: number }.
 */
export const incrementVerificationAttemptsIfAllowed = async (userId, maxAttempts = 5) => {
    const result = await prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
            email_verification_attempts: { lt: maxAttempts },
        },
        data: {
            email_verification_attempts: { increment: 1 },
        },
    })

    if (result.count === 0) {
        return {
            allowed: false,
            count: 0,
            attempts: maxAttempts,
        }
    }

    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email_verification_attempts: true },
    })

    return {
        allowed: true,
        count: result.count,
        attempts: updatedUser?.email_verification_attempts ?? maxAttempts,
    }
}

/**
 * Atomically acquire the resend cooldown slot.
 * Succeeds only if email_verified = false AND
 * (last_sent IS NULL OR last_sent <= now - cooldownSeconds).
 *
 * Returns affected rows count (1 = cooldown slot acquired, 0 = cooldown active or already verified).
 */
export const acquireVerificationResendCooldown = async (userId, now = new Date(), cooldownSeconds = 60) => {
    const cooldownCutoff = new Date(now.getTime() - cooldownSeconds * 1000)

    const result = await prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
            OR: [
                { email_verification_last_sent: null },
                { email_verification_last_sent: { lte: cooldownCutoff } },
            ],
        },
        data: {
            email_verification_last_sent: now,
        },
    })

    return result.count
}

/**
 * Reset resend cooldown only if it still belongs to this failed send attempt.
 */
export const resetVerificationResendCooldown = (userId, expectedTimestamp) => {
    return prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
            email_verification_last_sent: expectedTimestamp,
        },
        data: {
            email_verification_last_sent: null,
        },
    })
}

/**
 * Restore the previous verification state only if the failed send still owns it.
 */
export const rollbackVerificationCodeAfterEmailFailure = (
    userId,
    { writtenHash, writtenLastSent, previousState }
) => {
    return prisma.user.updateMany({
        where: {
            id: userId,
            email_verified: false,
            email_verification_hash: writtenHash,
            email_verification_last_sent: writtenLastSent,
        },
        data: {
            email_verification_hash: previousState.hash,
            email_verification_expires_at: previousState.expiresAt,
            email_verification_attempts: previousState.attempts,
            email_verification_last_sent: null,
        },
    })
}

/**
 * Mark user's email as verified and clear all verification fields (unconditional by id).
 * Kept for backwards compatibility.
 */
export const clearVerificationFields = (userId) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            email_verified: true,
            email_verification_hash: null,
            email_verification_expires_at: null,
            email_verification_attempts: 0,
            email_verification_last_sent: null,
        },
    })
}

/**
 * Increment the failed verification attempt count for a user (unconditional).
 * Kept for backwards compatibility.
 */
export const incrementVerificationAttempts = (userId) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            email_verification_attempts: { increment: 1 },
        },
    })
}
