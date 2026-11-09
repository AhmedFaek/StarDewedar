import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { mock, test } from 'node:test'

Object.assign(process.env, {
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const state = {
    user: null,
    resetResult: { count: 1 },
    calls: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async () => null,
        findUserById: async () => null,
        updateUser: async () => null,
    },
})

mock.module(authRepoUrl, {
    exports: {
        findUserByResetToken: async (hashedToken) => {
            state.calls.push(['find', hashedToken])
            return state.user
        },
        resetPassword: async (...args) => {
            state.calls.push(['reset', ...args])
            return state.resetResult
        },
    },
})

mock.module(mailerUrl, {
    exports: { sendEmail: async () => ({ messageId: 'test-message-id' }) },
})

mock.module(emailValidationUrl, {
    exports: {
        validateCustomerEmail: async (email) => ({ isValid: true, normalizedEmail: email }),
        normalizeEmail: (email) => email.toLowerCase(),
    },
})

const { resetPassword } = await import('../src/modules/auth/auth.service.js')

const rawToken = 'single-use-reset-token'
const expectedTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

const resetState = (user, resetResult = { count: 1 }) => {
    state.user = user
    state.resetResult = resetResult
    state.calls.length = 0
}

test('resetting an unverified customer password requests verification in the same repository operation', async () => {
    resetState({
        id: 'unverified-customer',
        role: 'customer',
        email_verified: false,
    })

    const result = await resetPassword(rawToken, 'A-strong-new-password-123')

    assert.deepEqual(result, { message: 'Password has been reset successfully' })
    assert.equal(state.calls.length, 2)
    assert.deepEqual(state.calls[0], ['find', expectedTokenHash])
    assert.equal(state.calls[1][0], 'reset')
    assert.equal(state.calls[1][1], 'unverified-customer')
    assert.equal(state.calls[1][2], expectedTokenHash)
    assert.match(state.calls[1][3], /^\$2[aby]\$/u)
    assert.deepEqual(state.calls[1][4], { verifyEmail: true })
    assert.deepEqual(Object.keys(result), ['message'])
})

test('resetting an already-verified customer does not change verification state', async () => {
    resetState({
        id: 'verified-customer',
        role: 'customer',
        email_verified: true,
    })

    await resetPassword(rawToken, 'A-strong-new-password-123')

    assert.deepEqual(state.calls[1][4], { verifyEmail: false })
})

test('resetting an unverified non-customer does not change verification state', async () => {
    resetState({
        id: 'unverified-admin',
        role: 'sales_support_manager',
        email_verified: false,
    })

    await resetPassword(rawToken, 'A-strong-new-password-123')

    assert.deepEqual(state.calls[1][4], { verifyEmail: false })
})

test('reset fails if the conditional token redemption update affects no row', async () => {
    resetState({
        id: 'unverified-customer',
        role: 'customer',
        email_verified: false,
    }, { count: 0 })

    await assert.rejects(
        resetPassword(rawToken, 'A-strong-new-password-123'),
        { message: 'Invalid or expired reset token' }
    )
    assert.equal(state.calls.filter(([operation]) => operation === 'reset').length, 1)
})
