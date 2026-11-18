import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { test } from 'node:test'

Object.assign(process.env, {
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'optional-auth-test-secret',
    JWT_REFRESH_SECRET: 'optional-auth-refresh-test-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const [
    { optionalAuth, setUserLookup },
    { default: env },
    { validateFormTiming },
    { verifyTurnstile },
    { default: quoteRouter },
    { default: visitRouter },
    { default: boqRouter },
    quoteController,
    visitController,
    boqController,
] = await Promise.all([
    import('../src/middleware/auth.middleware.js'),
    import('../src/config/env.js'),
    import('../src/middleware/formTiming.middleware.js'),
    import('../src/middleware/turnstile.middleware.js'),
    import('../src/modules/quoteRequests/quote.routes.js'),
    import('../src/modules/visitRequests/visit.routes.js'),
    import('../src/modules/boqRequests/boq.routes.js'),
    import('../src/modules/quoteRequests/quote.controller.js'),
    import('../src/modules/visitRequests/visit.controller.js'),
    import('../src/modules/boqRequests/boq.controller.js'),
])

const invoke = async (authorization) => {
    const req = { headers: {} }
    if (authorization !== undefined) req.headers.authorization = authorization
    const res = {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode
            return this
        },
        json(body) {
            this.body = body
            return this
        },
    }
    let nextCalls = 0

    await optionalAuth(req, res, () => { nextCalls += 1 })
    return { req, res, nextCalls }
}

test('optional auth treats a missing Authorization header as a guest', async (t) => {
    setUserLookup(async () => {
        assert.fail('Guest requests must not look up a user')
    })
    t.after(() => setUserLookup())

    const { req, res, nextCalls } = await invoke(undefined)
    assert.equal(nextCalls, 1)
    assert.equal(req.user, undefined)
    assert.equal(res.statusCode, null)
})

test('optional auth loads valid customers and staff from the existing user lookup', async (t) => {
    const users = new Map([
        ['customer-id', { id: 'customer-id', role: 'customer', name: 'Customer' }],
        ['staff-id', { id: 'staff-id', role: 'sales_support_manager', name: 'Staff' }],
    ])
    setUserLookup(async (id) => users.get(id))
    t.after(() => setUserLookup())

    for (const [userId, role, name] of [
        ['customer-id', 'customer', 'Customer'],
        ['staff-id', 'sales_support_manager', 'Staff'],
    ]) {
        const token = jwt.sign({ userId }, env.jwtSecret, { algorithm: 'HS256' })
        const { req, res, nextCalls } = await invoke(`Bearer ${token}`)
        assert.equal(nextCalls, 1)
        assert.equal(res.statusCode, null)
        assert.deepEqual(req.user, { userId, role, name })
    }
})

test('optional auth rejects invalid, expired, malformed, and unrecognized access tokens', async (t) => {
    setUserLookup(async (id) => id === 'missing-user'
        ? null
        : { id, role: 'customer', name: 'Customer' })
    t.after(() => setUserLookup())

    const expiredToken = jwt.sign(
        { userId: 'customer-id', exp: Math.floor(Date.now() / 1000) - 10 },
        env.jwtSecret,
        { algorithm: 'HS256' }
    )
    const unknownUserToken = jwt.sign(
        { userId: 'missing-user' },
        env.jwtSecret,
        { algorithm: 'HS256' }
    )

    for (const authorization of [
        'Bearer not-a-token',
        `Bearer ${expiredToken}`,
        `Bearer ${unknownUserToken}`,
        'Basic token',
        'Bearer',
        'Bearer token extra',
    ]) {
        const { req, res, nextCalls } = await invoke(authorization)
        assert.equal(res.statusCode, 401, authorization)
        assert.deepEqual(res.body, {
            success: false,
            code: 'OPTIONAL_AUTH_INVALID',
            message: 'Invalid access token',
        }, authorization)
        assert.equal(req.user, undefined, authorization)
        assert.equal(nextCalls, 0, authorization)
    }
})

test('real request router stacks place optional auth before timing and Turnstile', () => {
    const routes = [
        [quoteRouter, quoteController.createQuote, [
            null,
            optionalAuth,
            validateFormTiming,
            verifyTurnstile,
            null,
            null,
            quoteController.createQuote,
        ]],
        [visitRouter, visitController.createVisit, [
            null,
            optionalAuth,
            validateFormTiming,
            verifyTurnstile,
            null,
            null,
            visitController.createVisit,
        ]],
        [boqRouter, boqController.createBOQ, [
            null,
            optionalAuth,
            validateFormTiming,
            verifyTurnstile,
            null,
            null,
            boqController.createBOQ,
        ]],
    ]

    for (const [router, controller, expectedStack] of routes) {
        const route = router.stack.find((layer) =>
            layer.route?.path === '/' && layer.route.methods.post
        )?.route
        assert.ok(route, controller.name)

        const handlers = route.stack.map(({ handle }) => handle)
        assert.equal(handlers.length, expectedStack.length, controller.name)
        for (const [index, expected] of expectedStack.entries()) {
            if (expected !== null) assert.equal(handlers[index], expected, controller.name)
        }
    }
})
