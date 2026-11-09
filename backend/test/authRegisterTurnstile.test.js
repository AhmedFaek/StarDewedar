import assert from 'node:assert/strict'
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
    registerCalls: 0,
    seenBody: null,
    seenTurnstileHeader: null,
}

const controllerUrl = new URL('../src/modules/auth/auth.controller.js', import.meta.url).href
const noContent = (_req, res) => res.status(204).end()

mock.module(controllerUrl, {
    exports: {
        register: async (req, res) => {
            state.registerCalls += 1
            state.seenBody = req.body
            state.seenTurnstileHeader = req.headers['x-turnstile-token']
            res.status(201).json({
                success: true,
                tokenHeader: state.seenTurnstileHeader,
                body: state.seenBody,
            })
        },
        verifyEmail: noContent,
        resendVerification: noContent,
        login: noContent,
        refresh: noContent,
        forgotPassword: noContent,
        resetPassword: noContent,
        logout: noContent,
        changePassword: noContent,
        createUser: noContent,
    },
})

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

const postRegister = (port, { token, body = { email: 'customer@example.com' } }) => (
    new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' }
        if (token !== undefined) headers['X-Turnstile-Token'] = token
        const req = httpRequest({
            host: '127.0.0.1',
            port,
            path: '/auth/register',
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
        req.end(JSON.stringify(body))
    })
)

const siteverifyResponse = (payload) => ({
    ok: true,
    status: 200,
    json: async () => payload,
})

test('register rejects a missing challenge before any downstream account work', async (t) => {
    state.registerCalls = 0
    const port = await listen(t)
    t.mock.method(globalThis, 'fetch', async () => {
        assert.fail('Siteverify must not run without a token')
    })

    const result = await postRegister(port, {})
    assert.equal(result.status, 400)
    assert.deepEqual(result.body, {
        success: false,
        code: 'TURNSTILE_FAILED',
        message: 'Please complete the security verification and try again.',
    })
    assert.equal(state.registerCalls, 0)
})

test('register rejects an invalid challenge without logging its token or calling the controller', async (t) => {
    state.registerCalls = 0
    const port = await listen(t)
    const logs = []
    t.mock.method(console, 'warn', (...args) => logs.push(args))
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
        success: false,
        'error-codes': ['invalid-input-response'],
    }))

    const secretToken = 'sensitive-turnstile-token'
    const result = await postRegister(port, { token: secretToken })
    assert.equal(result.status, 403)
    assert.deepEqual(result.body, {
        success: false,
        code: 'TURNSTILE_FAILED',
        message: 'Please complete the security verification and try again.',
    })
    assert.equal(state.registerCalls, 0)
    assert.doesNotMatch(JSON.stringify(logs), /sensitive-turnstile-token/u)
})

test('register fails closed on a provider network error without calling the controller', async (t) => {
    state.registerCalls = 0
    const port = await listen(t)
    t.mock.method(globalThis, 'fetch', async () => {
        throw new TypeError('provider unavailable')
    })

    const result = await postRegister(port, { token: 'test-token' })
    assert.equal(result.status, 503)
    assert.deepEqual(result.body, {
        success: false,
        code: 'TURNSTILE_UNAVAILABLE',
        message: 'Security verification service is temporarily unavailable. Please try again later.',
    })
    assert.equal(state.registerCalls, 0)
})

test('register consumes a valid header token before the controller receives the request', async (t) => {
    state.registerCalls = 0
    state.seenBody = null
    state.seenTurnstileHeader = null
    const port = await listen(t)
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
        success: true,
        action: 'public_request',
    }))

    const secretToken = 'valid-turnstile-token'
    const result = await postRegister(port, {
        token: secretToken,
        body: {
            name: 'Test Customer',
            email: 'customer@example.com',
            password: 'StrongPass123',
        },
    })

    assert.equal(result.status, 201)
    assert.equal(state.registerCalls, 1)
    assert.deepEqual(state.seenBody, {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'StrongPass123',
    })
    assert.equal(state.seenTurnstileHeader, undefined)
    assert.equal(JSON.stringify(result.body).includes(secretToken), false)
})
