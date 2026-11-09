import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { mock, test } from 'node:test'
import {
    RESET_TOKEN_COOLDOWN_SECONDS,
    RESET_TOKEN_EXPIRY_MINUTES,
    getResetTokenCooldownExpiryCutoff,
} from '../src/modules/auth/resetToken.constants.js'

Object.assign(process.env, {
    NODE_ENV: 'test',
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

const genericResponse = { message: 'If an account exists, a reset link has been sent.' }
const state = {
    user: null,
    updateCount: 1,
    updateError: null,
    existingResetExpiry: null,
    evaluateCooldownPredicate: false,
    updateCalls: [],
    updateResultCounts: [],
    emailCalls: [],
    templateCalls: [],
    mailError: null,
    mailPromise: null,
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href
const resetTemplateUrl = new URL('../src/utils/resetPasswordEmail.template.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async () => state.user,
    },
})

mock.module(authRepoUrl, {
    exports: {
        saveResetTokenIfCooldownElapsed: async (...args) => {
            state.updateCalls.push(args)
            if (state.updateError) throw state.updateError
            if (state.evaluateCooldownPredicate) {
                const cutoff = args[3]
                const count = state.existingResetExpiry === null
                    || state.existingResetExpiry <= cutoff
                    ? 1
                    : 0
                state.updateResultCounts.push(count)
                return { count }
            }
            state.updateResultCounts.push(state.updateCount)
            return { count: state.updateCount }
        },
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async (message) => {
            state.emailCalls.push(message)
            if (state.mailError) throw state.mailError
            if (state.mailPromise) return state.mailPromise
            return { messageId: 'test-message-id' }
        },
    },
})

mock.module(emailValidationUrl, {
    exports: {
        normalizeEmail: (email) => email.trim().toLowerCase(),
        validateCustomerEmail: async (email) => ({ isValid: true, normalizedEmail: email }),
    },
})

mock.module(resetTemplateUrl, {
    exports: {
        resetPasswordEmailTemplate: (options) => {
            state.templateCalls.push(options)
            return '<p>reset link</p>'
        },
    },
})

const { clearForgotPasswordSendCapForTests } = await import(
    '../src/modules/auth/forgotPasswordSendCap.js'
)
const { forgotPassword } = await import('../src/modules/auth/auth.service.js')
const { forgotPassword: forgotPasswordController } = await import(
    '../src/modules/auth/auth.controller.js'
)

const resetState = (email = `customer-${crypto.randomUUID()}@example.com`) => {
    clearForgotPasswordSendCapForTests()
    state.user = { id: `user-${crypto.randomUUID()}`, email, role: 'customer' }
    state.updateCount = 1
    state.updateError = null
    state.existingResetExpiry = null
    state.evaluateCooldownPredicate = false
    state.updateCalls.length = 0
    state.updateResultCounts.length = 0
    state.emailCalls.length = 0
    state.templateCalls.length = 0
    state.mailError = null
    state.mailPromise = null
    return email
}

const flushBackgroundSends = () => new Promise((resolve) => setImmediate(resolve))

const invokeForgotPasswordController = async (email) => {
    const res = {
        statusCode: 200,
        body: null,
        json(body) {
            this.body = body
            return this
        },
    }
    let forwardedError = null
    await forgotPasswordController({ body: { email } }, res, (error) => {
        forwardedError = error
    })
    if (forwardedError) throw forwardedError
    return { status: res.statusCode, body: res.body }
}

test('unknown email returns the generic response, sends nothing, and consumes no cap slot', async (t) => {
    const email = `unknown-${crypto.randomUUID()}@example.com`
    t.after(clearForgotPasswordSendCapForTests)
    resetState(email)
    state.user = null

    assert.deepEqual(await forgotPassword(email), genericResponse)
    assert.equal(state.updateCalls.length, 0)
    assert.equal(state.emailCalls.length, 0)

    state.user = { id: `user-${crypto.randomUUID()}`, email, role: 'customer' }
    for (let index = 0; index < 5; index += 1) {
        assert.deepEqual(await forgotPassword(email), genericResponse)
    }
    await flushBackgroundSends()
    assert.equal(state.updateCalls.length, 5)
    assert.equal(state.emailCalls.length, 5)
})

test('service honors exact 60-second cooldown boundaries using a fixed clock', async (t) => {
    clearForgotPasswordSendCapForTests()
    t.after(clearForgotPasswordSendCapForTests)
    const fixedNow = new Date('2026-11-07T12:00:00.000Z')
    t.mock.timers.enable({ apis: ['Date'], now: fixedNow })
    const cases = [
        ['exactly 60 seconds old', new Date('2026-11-07T12:14:00.000Z'), 1],
        ['59 seconds old', new Date('2026-11-07T12:14:01.000Z'), 0],
        ['null expiry', null, 1],
        ['expired token', new Date('2026-11-07T11:59:59.999Z'), 1],
    ]

    for (const [label, priorExpiry, expectedCount] of cases) {
        const email = `cooldown-${label.replaceAll(' ', '-')}-${crypto.randomUUID()}@example.com`
        resetState(email)
        state.existingResetExpiry = priorExpiry
        state.evaluateCooldownPredicate = true

        assert.deepEqual(await forgotPassword(email), genericResponse, label)
        const [, , expiresAt, cutoff] = state.updateCalls[0]
        assert.equal(expiresAt.getTime(), fixedNow.getTime() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)
        assert.equal(cutoff.getTime(), fixedNow.getTime() + 14 * 60 * 1000)
        assert.equal(state.updateResultCounts[0], expectedCount, label)
        await flushBackgroundSends()
        assert.equal(state.emailCalls.length, expectedCount, label)
    }
})

test('cooldown conditional miss returns the generic response, releases the slot, and sends nothing', async (t) => {
    const email = resetState()
    t.after(clearForgotPasswordSendCapForTests)
    state.updateCount = 0

    assert.deepEqual(await forgotPassword(email), genericResponse)
    assert.equal(state.emailCalls.length, 0)

    state.updateCount = 1
    assert.deepEqual(await forgotPassword(email), genericResponse)
    await flushBackgroundSends()
    assert.equal(state.updateCalls.length, 2)
    assert.equal(state.emailCalls.length, 1)
})

test('conditional-update exceptions release the slot and are surfaced', async (t) => {
    const email = resetState()
    t.after(clearForgotPasswordSendCapForTests)
    state.updateError = new Error('database unavailable')

    await assert.rejects(forgotPassword(email), { message: 'database unavailable' })
    state.updateError = null

    assert.deepEqual(await forgotPassword(email), genericResponse)
    await flushBackgroundSends()
    assert.equal(state.updateCalls.length, 2)
    assert.equal(state.emailCalls.length, 1)
})

test('daily cap counts only successful conditional updates and capped requests keep the token untouched', async (t) => {
    const email = resetState()
    t.after(clearForgotPasswordSendCapForTests)
    for (let index = 0; index < 5; index += 1) {
        assert.deepEqual(await forgotPassword(email), genericResponse)
    }
    await flushBackgroundSends()

    state.updateCount = 0
    const updateCallsAtCap = state.updateCalls.length
    const templateCallsAtCap = state.templateCalls.length
    assert.deepEqual(await forgotPassword(email), genericResponse)
    assert.equal(state.updateCalls.length, updateCallsAtCap)
    assert.equal(state.templateCalls.length, templateCallsAtCap)
    assert.equal(state.emailCalls.length, 5)
})

test('send failures stay generic and retain their daily-cap reservations without logging email or token', async (t) => {
    const email = resetState()
    const logs = []
    t.after(clearForgotPasswordSendCapForTests)
    t.mock.method(console, 'error', (...args) => logs.push(args))
    state.mailError = new Error(`SMTP failed for ${email}`)

    for (let index = 0; index < 5; index += 1) {
        assert.deepEqual(await forgotPassword(email), genericResponse)
    }
    await flushBackgroundSends()

    const rawToken = new URL(state.templateCalls[0].resetUrl).searchParams.get('token')
    const updateCallsAtCap = state.updateCalls.length
    assert.deepEqual(await forgotPassword(email), genericResponse)
    assert.equal(state.updateCalls.length, updateCallsAtCap)
    assert.equal(logs.length, 5)
    assert.doesNotMatch(JSON.stringify(logs), new RegExp(email, 'u'))
    assert.doesNotMatch(JSON.stringify(logs), new RegExp(rawToken, 'u'))
    assert.ok(logs.every(([message, details]) => (
        message === 'Failed to send password reset email'
        && details.errorName === 'Error'
    )))
})

test('background mail failure is caught without emitting unhandledRejection', async (t) => {
    const email = resetState()
    const unhandled = []
    const listener = (error) => unhandled.push(error)
    t.after(clearForgotPasswordSendCapForTests)
    process.on('unhandledRejection', listener)
    t.after(() => process.removeListener('unhandledRejection', listener))
    state.mailError = new Error('mail failed')
    t.mock.method(console, 'error', () => {})

    assert.deepEqual(await forgotPassword(email), genericResponse)
    await flushBackgroundSends()

    assert.deepEqual(unhandled, [])
})

test('controller returns the same HTTP status and body for unknown, known, cooldown, capped, and send-failure cases', async (t) => {
    const responses = []
    t.after(clearForgotPasswordSendCapForTests)

    const unknownEmail = `unknown-${crypto.randomUUID()}@example.com`
    resetState(unknownEmail)
    state.user = null
    responses.push(await invokeForgotPasswordController(unknownEmail))
    assert.equal(state.emailCalls.length, 0)

    const knownEmail = `known-${crypto.randomUUID()}@example.com`
    resetState(knownEmail)
    responses.push(await invokeForgotPasswordController(knownEmail))
    await flushBackgroundSends()
    assert.equal(state.emailCalls.length, 1)

    const cooldownEmail = `cooldown-${crypto.randomUUID()}@example.com`
    resetState(cooldownEmail)
    state.updateCount = 0
    responses.push(await invokeForgotPasswordController(cooldownEmail))
    assert.equal(state.emailCalls.length, 0)

    const cappedEmail = `capped-${crypto.randomUUID()}@example.com`
    resetState(cappedEmail)
    for (let index = 0; index < 5; index += 1) {
        await invokeForgotPasswordController(cappedEmail)
    }
    await flushBackgroundSends()
    responses.push(await invokeForgotPasswordController(cappedEmail))
    assert.equal(state.emailCalls.length, 5)

    const failedEmail = `send-failure-${crypto.randomUUID()}@example.com`
    resetState(failedEmail)
    state.mailError = new Error('smtp failed')
    t.mock.method(console, 'error', () => {})
    responses.push(await invokeForgotPasswordController(failedEmail))
    await flushBackgroundSends()

    assert.deepEqual(responses, Array.from({ length: 5 }, () => ({
        status: 200,
        body: genericResponse,
    })))
})

test('token issuance and cooldown cutoff share the exported lifetime constant', async (t) => {
    const email = resetState()
    t.after(clearForgotPasswordSendCapForTests)
    const before = Date.now()

    await forgotPassword(email)

    const after = Date.now()
    const [, , expiresAt, cooldownExpiryCutoff] = state.updateCalls[0]
    assert.ok(expiresAt.getTime() - before >= RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)
    assert.ok(expiresAt.getTime() - after <= RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)
    assert.equal(
        getResetTokenCooldownExpiryCutoff(new Date(expiresAt.getTime() - RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000))
            .getTime(),
        cooldownExpiryCutoff.getTime()
    )
    assert.equal(
        expiresAt.getTime() - cooldownExpiryCutoff.getTime(),
        RESET_TOKEN_COOLDOWN_SECONDS * 1000
    )
})

test('SMTP completion is not awaited before the generic response', async (t) => {
    const email = resetState()
    t.after(clearForgotPasswordSendCapForTests)
    let resolveSend
    state.mailPromise = new Promise((resolve) => {
        resolveSend = resolve
    })

    const response = await Promise.race([
        forgotPassword(email),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP was awaited')), 100)),
    ])

    assert.deepEqual(response, genericResponse)
    assert.equal(state.emailCalls.length, 1)
    resolveSend({ messageId: 'sent' })
})
