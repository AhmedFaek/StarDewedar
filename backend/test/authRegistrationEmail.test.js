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
    mailError: null,
    sentMessages: [],
    cooldownResets: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async () => null,
        createUser: async (data) => ({ id: 'test-user-id', ...data }),
    },
})

mock.module(authRepoUrl, {
    exports: {
        resetVerificationResendCooldown: async (...args) => state.cooldownResets.push(args),
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async (message) => {
            state.sentMessages.push(message)
            if (state.mailError) throw state.mailError
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

const { register } = await import('../src/modules/auth/auth.service.js')

const registration = {
    name: 'Test Customer',
    email: 'customer@example.com',
    password: 'a-test-password',
}

test('register reports successful verification email delivery', async () => {
    state.mailError = null
    state.sentMessages.length = 0
    state.cooldownResets.length = 0

    const result = await register(registration)

    assert.deepEqual(result, {
        requiresEmailVerification: true,
        email: registration.email,
        emailSent: true,
        message: 'Registration successful. Please verify your email with the 6-digit code sent to your inbox.',
    })
    assert.equal(state.sentMessages.length, 1)
    assert.equal(state.cooldownResets.length, 0)
})

test('register reports email delivery failure and releases the resend cooldown', async (t) => {
    state.mailError = new Error('SMTP unavailable')
    state.sentMessages.length = 0
    state.cooldownResets.length = 0
    t.after(() => {
        state.mailError = null
    })
    const logs = []
    t.mock.method(console, 'error', (entry) => logs.push(entry))

    const result = await register(registration)

    assert.deepEqual(result, {
        requiresEmailVerification: true,
        email: registration.email,
        emailSent: false,
        reason: 'send_failed',
        message: 'Registration successful, but we could not send your verification code. Please request a new one.',
    })
    assert.equal(state.sentMessages.length, 1)
    assert.deepEqual(state.cooldownResets, [['test-user-id', null]])
    assert.equal(logs.length, 1)
    assert.deepEqual(JSON.parse(logs[0]), {
        event: 'auth.registration_verification_email_failed',
        userId: 'test-user-id',
        errorName: 'Error',
        cooldownReset: true,
    })
    assert.doesNotMatch(logs[0], /a-test-password|email_verification_hash|verificationCode/)
    state.mailError = null
})
