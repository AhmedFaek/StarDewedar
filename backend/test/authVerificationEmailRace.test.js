import assert from 'node:assert/strict'
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
    sendAction: async () => {},
    writtenTimestamp: null,
    resetCalls: [],
    rollbackCalls: [],
    refreshCalls: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

const sameDate = (left, right) => (
    left instanceof Date
    && right instanceof Date
    && left.getTime() === right.getTime()
)

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async () => state.user,
        findUserById: async () => state.user,
        createUser: async (data) => {
            state.user = { id: 'test-user-id', ...data }
            state.writtenTimestamp = data.email_verification_last_sent
            return state.user
        },
        updateUser: async () => {},
    },
})

mock.module(authRepoUrl, {
    exports: {
        resetVerificationResendCooldown: async (userId, expectedTimestamp) => {
            state.resetCalls.push({ userId, expectedTimestamp })
            if (
                state.user?.id === userId
                && !state.user.email_verified
                && sameDate(state.user.email_verification_last_sent, expectedTimestamp)
            ) {
                state.user.email_verification_last_sent = null
                return { count: 1 }
            }
            return { count: 0 }
        },
        refreshUnverifiedRegistration: async (userId, data) => {
            state.refreshCalls.push({ userId, data })
            Object.assign(state.user, data)
            state.writtenTimestamp = data.email_verification_last_sent
            return { count: 1 }
        },
        acquireVerificationResendCooldown: async (userId, now) => {
            if (state.user?.id !== userId || state.user.email_verified) return 0
            state.user.email_verification_last_sent = now
            return 1
        },
        saveVerificationCode: async (userId, { hashedCode, expiresAt, attempts, lastSent }) => {
            if (state.user?.id !== userId || state.user.email_verified) return { count: 0 }
            Object.assign(state.user, {
                email_verification_hash: hashedCode,
                email_verification_expires_at: expiresAt,
                email_verification_attempts: attempts,
                email_verification_last_sent: lastSent,
            })
            return { count: 1 }
        },
        rollbackVerificationCodeAfterEmailFailure: async (userId, update) => {
            state.rollbackCalls.push({ userId, update })
            if (
                state.user?.id !== userId
                || state.user.email_verified
                || state.user.email_verification_hash !== update.writtenHash
                || !sameDate(state.user.email_verification_last_sent, update.writtenLastSent)
            ) {
                return { count: 0 }
            }
            Object.assign(state.user, {
                email_verification_hash: update.previousState.hash,
                email_verification_expires_at: update.previousState.expiresAt,
                email_verification_attempts: update.previousState.attempts,
                email_verification_last_sent: null,
            })
            return { count: 1 }
        },
        consumeVerificationCode: async () => 0,
        incrementVerificationAttemptsIfAllowed: async () => ({ allowed: false, count: 0, attempts: 5 }),
        saveResetToken: async () => {},
        findUserByResetToken: async () => null,
        resetPassword: async () => ({ count: 0 }),
        changePassword: async () => {},
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async () => state.sendAction(),
    },
})

mock.module(emailValidationUrl, {
    exports: {
        validateCustomerEmail: async (email) => ({
            isValid: true,
            normalizedEmail: email.toLowerCase(),
        }),
        normalizeEmail: (email) => email.toLowerCase(),
    },
})

const { register, resendVerificationCode } = await import('../src/modules/auth/auth.service.js')

const registration = {
    name: 'Test Customer',
    email: 'customer@example.com',
    password: 'a-test-password',
}

const makeExpiredUser = () => ({
    id: 'test-user-id',
    name: 'Original Name',
    email: registration.email,
    password: 'hashed-password',
    email_verified: false,
    email_verification_hash: 'previous-hash',
    email_verification_expires_at: new Date(Date.now() - 60_000),
    email_verification_attempts: 3,
    email_verification_last_sent: new Date(Date.now() - 120_000),
})

const resetState = () => {
    state.user = null
    state.sendAction = async () => {}
    state.writtenTimestamp = null
    state.resetCalls.length = 0
    state.rollbackCalls.length = 0
    state.refreshCalls.length = 0
}

const newerTimestamp = () => new Date(Date.now() + 60_000)

test('registration failure does not clear a newer resend timestamp', async (t) => {
    resetState()
    t.mock.method(console, 'error', () => {})
    state.sendAction = async () => {
        state.user.email_verification_last_sent = newerTimestamp()
        throw new Error('SMTP unavailable')
    }

    const response = await register(registration)

    assert.equal(response.emailSent, false)
    assert.equal(state.resetCalls.length, 1)
    assert.equal(state.resetCalls[0].expectedTimestamp, state.writtenTimestamp)
    assert.notEqual(state.user.email_verification_last_sent, null)
})

test('F3 refresh failure does not clear a newer resend timestamp', async (t) => {
    resetState()
    state.user = makeExpiredUser()
    t.mock.method(console, 'error', () => {})
    state.sendAction = async () => {
        state.user.email_verification_last_sent = newerTimestamp()
        throw new Error('SMTP unavailable')
    }

    const response = await register(registration)
    const refreshedTimestamp = state.refreshCalls[0].data.email_verification_last_sent

    assert.equal(response.emailSent, false)
    assert.equal(state.resetCalls.length, 1)
    assert.equal(state.resetCalls[0].expectedTimestamp, refreshedTimestamp)
    assert.notEqual(state.user.email_verification_last_sent.getTime(), refreshedTimestamp.getTime())
})

test('failed resend restores prior code state and clears its timestamp if still current', async () => {
    resetState()
    state.user = makeExpiredUser()
    const previousState = {
        hash: state.user.email_verification_hash,
        expiresAt: state.user.email_verification_expires_at,
        attempts: state.user.email_verification_attempts,
        lastSent: state.user.email_verification_last_sent,
    }
    state.sendAction = async () => {
        throw new Error('SMTP unavailable')
    }

    await assert.rejects(resendVerificationCode(registration.email), {
        code: 'EMAIL_SEND_FAILED',
    })

    assert.equal(state.user.email_verification_hash, previousState.hash)
    assert.equal(state.user.email_verification_expires_at, previousState.expiresAt)
    assert.equal(state.user.email_verification_attempts, previousState.attempts)
    assert.equal(state.user.email_verification_last_sent, null)
    assert.equal(state.rollbackCalls.length, 1)
    assert.equal(state.rollbackCalls[0].update.previousState.lastSent, previousState.lastSent)
})

test('failed resend leaves code and timestamp from a newer request untouched', async () => {
    resetState()
    state.user = makeExpiredUser()
    state.sendAction = async () => {
        state.user.email_verification_hash = 'newer-request-hash'
        state.user.email_verification_last_sent = newerTimestamp()
        throw new Error('SMTP unavailable')
    }

    await assert.rejects(resendVerificationCode(registration.email), {
        code: 'EMAIL_SEND_FAILED',
    })

    assert.equal(state.user.email_verification_hash, 'newer-request-hash')
    assert.notEqual(state.user.email_verification_last_sent, null)
})

test('successful resend keeps the newly issued code and cooldown unchanged', async () => {
    resetState()
    state.user = makeExpiredUser()

    const response = await resendVerificationCode(registration.email)

    assert.equal(response.email, registration.email)
    assert.notEqual(state.user.email_verification_hash, 'previous-hash')
    assert.equal(state.user.email_verification_attempts, 0)
    assert.ok(state.user.email_verification_last_sent instanceof Date)
    assert.equal(state.rollbackCalls.length, 0)
})
