export const RESET_TOKEN_EXPIRY_MINUTES = 15
export const RESET_TOKEN_COOLDOWN_SECONDS = 60

export const getResetTokenCooldownExpiryCutoff = (now) => new Date(
    now.getTime()
    + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    - RESET_TOKEN_COOLDOWN_SECONDS * 1000
)
