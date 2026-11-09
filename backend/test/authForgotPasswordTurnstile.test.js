import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { createServer } from 'node:http'
import { request as httpRequest } from 'node:http'
import { mock, test } from 'node:test'

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

const state = {
    user: null,
    lookupCalls: [],
    saveCalls: [],
    mailCalls: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async (email) => {
            state.lookupCalls.push(email)
            return state.user
        },
    },
})

mock.module(authRepoUrl, {
    exports: {
        saveResetTokenIfCooldownElapsed: async (...args) => {
            state.saveCalls.push(args)
            return { count: 1 }
        },
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async (message) => {
            state.mailCalls.push(message)
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

const { clearForgotPasswordSendCapForTests } = await import(
    '../src/modules/auth/forgotPasswordSendCap.js'
)
const { default: authRoutes } = await import('../src/modules/auth/auth.routes.js')
const express = (await import('express')).default
const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

const listen = async (t) => {
    const server = createServer(app)
    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
    }))
    return server.address().port
}

const postForgotPassword = (port, { email, token }) => (
    new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' }
        if (token !== undefined) headers['X-Turnstile-Token'] = token
        const req = httpRequest({
            host: '127.0.0.1',
            port,
            path: '/auth/forgot-password',
            method: 'POST',
            headers,
        }, (res) => {
            let responseBody = ''
            res.setEncoding('utf8')
            res.on('data', (chunk) => { responseBody += chunk })
            res.on('end', () => resolve({
                status: res.statusCode,
                body: JSON.parse(responseBody),
            }))
        })
        req.on('error', reject)
        req.end(JSON.stringify({ email }))
    })
)

const siteverifyResponse = (payload) => ({
    ok: true,
    status: 200,
    json: async () => payload,
})

const resetState = () => {
    clearForgotPasswordSendCapForTests()
    state.user = null
    state.lookupCalls.length = 0
    state.saveCalls.length = 0
    state.mailCalls.length = 0
}

const flushBackgroundSends = () => new Promise((resolve) => setImmediate(resolve))

test('forgot-password rejects missing challenge before validation, service, database, or mail', async (t) => {
    resetState()
    const port = await listen(t)
    t.mock.method(globalThis, 'fetch', async () => {
        assert.fail('Siteverify must not run without a token')
    })

    const result = await postForgotPassword(port, {
        email: 'not-an-email',
    })
    assert.deepEqual(result, {
        status: 400,
        body: {
            success: false,
            code: 'TURNSTILE_FAILED',
            message: 'Please complete the security verification and try again.',
        },
    })
    assert.equal(state.lookupCalls.length, 0)
    assert.equal(state.saveCalls.length, 0)
    assert.equal(state.mailCalls.length, 0)
})

test('forgot-password rejects invalid challenge before service, database, or mail', async (t) => {
    resetState()
    const port = await listen(t)
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
        success: false,
        'error-codes': ['invalid-input-response'],
    }))

    const result = await postForgotPassword(port, {
        email: `invalid-${crypto.randomUUID()}@example.com`,
        token: 'invalid-test-token',
    })
    assert.equal(result.status, 403)
    assert.equal(result.body.code, 'TURNSTILE_FAILED')
    assert.equal(state.lookupCalls.length, 0)
    assert.equal(state.saveCalls.length, 0)
    assert.equal(state.mailCalls.length, 0)
})

test('forgot-password fails closed on Cloudflare outage before service, database, or mail', async (t) => {
    resetState()
    const port = await listen(t)
    t.mock.method(globalThis, 'fetch', async () => {
        throw new TypeError('network unavailable')
    })

    const result = await postForgotPassword(port, {
        email: `offline-${crypto.randomUUID()}@example.com`,
        token: 'offline-test-token',
    })
    assert.equal(result.status, 503)
    assert.equal(result.body.code, 'TURNSTILE_UNAVAILABLE')
    assert.equal(state.lookupCalls.length, 0)
    assert.equal(state.saveCalls.length, 0)
    assert.equal(state.mailCalls.length, 0)
})

test('forgot-password accepts valid challenge, removes the token before service, and sends no token in mail data', async (t) => {
    resetState()
    const port = await listen(t)
    const logs = []
    t.mock.method(console, 'error', (...args) => logs.push(args))
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
        success: true,
        action: 'public_request',
    }))
    const email = `valid-${crypto.randomUUID()}@example.com`
    state.user = { id: 'forgot-password-user', email, role: 'customer' }
    const token = 'secret-valid-turnstile-token'

    const result = await postForgotPassword(port, { email, token })
    await flushBackgroundSends()

    assert.equal(result.status, 200)
    assert.deepEqual(result.body, { message: 'If an account exists, a reset link has been sent.' })
    assert.deepEqual(state.lookupCalls, [email])
    assert.equal(state.saveCalls.length, 1)
    assert.equal(state.mailCalls.length, 1)
    assert.doesNotMatch(JSON.stringify(state.lookupCalls), /secret-valid-turnstile-token/u)
    assert.doesNotMatch(JSON.stringify(state.mailCalls), /secret-valid-turnstile-token/u)
    assert.doesNotMatch(JSON.stringify(logs), /secret-valid-turnstile-token/u)
})
