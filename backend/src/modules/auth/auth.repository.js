import prisma from '../../utils/prisma.js'

/* ─── Password reset token operations ────────────────────────────────────── */

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
 * Atomically update the user's password, clear the reset token fields,
 * and invalidate all existing sessions (refresh tokens).
 */
export const resetPassword = (userId, hashedPassword) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            reset_password_token: null,
            reset_password_expires: null,
            hashed_refresh_token: null,
        },
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
