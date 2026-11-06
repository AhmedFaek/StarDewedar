import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { hashVerificationCode } from '../src/modules/auth/verificationCode.js'

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

const originalCode = '123456'

const state = {
    user: null,
    mailMessages: [],
    saveCalls: [],
    refreshCalls: [],
    createCalls: [],
    consumeCalls: [],
    attemptCalls: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async (email) => state.user?.email === email ? { ...state.user } : null,
        findUserById: async (id) => state.user?.id === id ? { ...state.user } : null,
        createUser: async (data) => {
            state.createCalls.push(data)
            state.user = { id: 'test-user', ...data }
            return { ...state.user }
        },
        updateUser: async (id, data) => {
            if (state.user?.id === id) Object.assign(state.user, data)
            return { ...state.user }
        },
    },
})

mock.module(authRepoUrl, {
    exports: {
        acquireVerificationResendCooldown: async (userId, now, cooldownSeconds) => {
            if (!state.user || state.user.id !== userId || state.user.email_verified) return 0
            const lastSent = state.user.email_verification_last_sent
            if (lastSent && now.getTime() - new Date(lastSent).getTime() < cooldownSeconds * 1000) {
                return 0
            }
            state.user.email_verification_last_sent = now
            return 1
        },
        saveVerificationCode: async (userId, { hashedCode, expiresAt, attempts, lastSent }) => {
            state.saveCalls.push({ userId, hashedCode, expiresAt, attempts, lastSent })
            Object.assign(state.user, {
                email_verification_hash: hashedCode,
                email_verification_expires_at: expiresAt,
                email_verification_attempts: attempts,
                email_verification_last_sent: lastSent,
            })
            return { count: 1 }
        },
        resetVerificationResendCooldown: async (userId, expectedTimestamp) => {
            if (
                state.user?.id === userId
                && state.user.email_verification_last_sent?.getTime() === expectedTimestamp?.getTime()
            ) {
                state.user.email_verification_last_sent = null
            }
            return { count: 1 }
        },
        consumeVerificationCode: async (userId, hashedCode, now) => {
            state.consumeCalls.push({ userId, hashedCode })
            if (
                !state.user
                || state.user.id !== userId
                || state.user.email_verified
                || state.user.email_verification_hash !== hashedCode
                || !state.user.email_verification_expires_at
                || new Date(state.user.email_verification_expires_at) <= now
            ) {
                return 0
            }
            Object.assign(state.user, {
                email_verified: true,
                email_verification_hash: null,
                email_verification_expires_at: null,
                email_verification_attempts: 0,
                email_verification_last_sent: null,
            })
            return 1
        },
        incrementVerificationAttemptsIfAllowed: async (userId, maxAttempts) => {
            state.attemptCalls.push({ userId, maxAttempts })
            if (!state.user || state.user.id !== userId || state.user.email_verification_attempts >= maxAttempts) {
                return { allowed: false, count: 0, attempts: maxAttempts }
            }
            state.user.email_verification_attempts += 1
            return {
                allowed: true,
                count: 1,
                attempts: state.user.email_verification_attempts,
            }
        },
        refreshUnverifiedRegistration: async (...args) => {
            state.refreshCalls.push(args)
            return { count: 0 }
        },
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async (message) => {
            state.mailMessages.push(message)
            return { messageId: 'test-message-id' }
        },
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

const { register, resendVerificationCode, verifyEmail } = await import('../src/modules/auth/auth.service.js')

const registration = {
    name: 'Pending Customer',
    email: 'customer@example.com',
    password: 'StrongPass123',
}

const resetState = () => {
    state.user = {
        id: 'test-user',
        name: registration.name,
        email: registration.email,
        password: 'existing-password-hash',
        role: 'customer',
        email_verified: false,
        email_verification_hash: hashVerificationCode(originalCode),
        email_verification_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        email_verification_attempts: 0,
        email_verification_last_sent: new Date(Date.now() - 2 * 60 * 1000),
    }
    state.mailMessages.length = 0
    state.saveCalls.length = 0
    state.refreshCalls.length = 0
    state.createCalls.length = 0
    state.consumeCalls.length = 0
    state.attemptCalls.length = 0
}

const burnFiveAttempts = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        await assert.rejects(verifyEmail(registration.email, '999999'), {
            code: 'INVALID_VERIFICATION_CODE',
        })
    }
    assert.equal(state.user.email_verification_attempts, 5)
}

const codeFromEmail = (html) => {
    const match = html.match(/<span[^>]*font-size:36px[^>]*>\s*(\d{6})\s*<\/span>/u)
    assert.ok(match, 'verification email should contain a six-digit code')
    return match[1]
}

test('attempt-locked code: correct code is rejected with a clear too-many-attempts error', async () => {
    resetState()
    await burnFiveAttempts()

    await assert.rejects(verifyEmail(registration.email, originalCode), {
        status: 429,
        code: 'MAX_VERIFICATION_ATTEMPTS_EXCEEDED',
        message: 'Too many failed attempts. Please request a new verification code.',
    })
    assert.equal(state.user.email_verified, false)
    assert.equal(state.consumeCalls.length, 5)
    assert.equal(state.attemptCalls.length, 5)
})

test('attempt-locked code: Resend issues a new code, resets attempts, and allows verification', async () => {
    resetState()
    await burnFiveAttempts()

    const resendResult = await resendVerificationCode(registration.email)

    assert.match(resendResult.message, /new 6-digit verification code/u)
    assert.equal(state.user.email_verification_attempts, 0)
    assert.equal(state.saveCalls.length, 1)
    assert.equal(state.saveCalls[0].attempts, 0)
    assert.equal(state.mailMessages.length, 1)
    const resentCode = codeFromEmail(state.mailMessages[0].html)

    const verificationResult = await verifyEmail(registration.email, resentCode)

    assert.equal(verificationResult.message, 'Email verified successfully.')
    assert.equal(state.user.email_verified, true)
    assert.equal(state.user.email_verification_attempts, 0)
})

test('attempt-locked code: re-registration returns code_pending and preserves lock and account data', async () => {
    resetState()
    await burnFiveAttempts()
    const before = { ...state.user }

    const result = await register({
        ...registration,
        name: 'Changed Name',
        password: 'DifferentPass456',
    })

    assert.equal(result.emailSent, false)
    assert.equal(result.reason, 'code_pending')
    assert.equal(state.user.name, before.name)
    assert.equal(state.user.password, before.password)
    assert.equal(state.user.email_verification_hash, before.email_verification_hash)
    assert.equal(state.user.email_verification_attempts, 5)
    assert.equal(state.refreshCalls.length, 0)
    assert.equal(state.createCalls.length, 0)
    assert.equal(state.mailMessages.length, 0)

    await assert.rejects(verifyEmail(registration.email, originalCode), {
        status: 429,
        code: 'MAX_VERIFICATION_ATTEMPTS_EXCEEDED',
    })
})
