import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { request as httpRequest } from 'node:http'
import { mock, test } from 'node:test'

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'change-password-access-test-secret',
    JWT_REFRESH_SECRET: 'change-password-refresh-test-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    VERIFICATION_CODE_PEPPER: '0123456789abcdef0123456789abcdef',
})

const state = { users: new Map() }
const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserById: async (id) => state.users.get(id) || null,
        findUserByEmail: async (email) => (
            [...state.users.values()].find((user) => user.email === email) || null
        ),
        updateUser: async (id, data) => {
            const user = { ...state.users.get(id), ...data }
            state.users.set(id, user)
            return user
        },
    },
})

mock.module(authRepoUrl, {
    exports: {
        changePassword: async (id, password) => {
            const user = { ...state.users.get(id), password, hashed_refresh_token: null }
            state.users.set(id, user)
            return user
        },
    },
})
mock.module(mailerUrl, { exports: { sendEmail: async () => ({}) } })

const [
    { default: app },
    { default: auth },
    authRoutesModule,
    authController,
    { default: env },
] = await Promise.all([
    import('../src/app.js'),
    import('../src/middleware/auth.middleware.js'),
    import('../src/modules/auth/auth.routes.js'),
    import('../src/modules/auth/auth.controller.js'),
    import('../src/config/env.js'),
])
const authRoutes = authRoutesModule.default

const CURRENT_PASSWORD = 'Correct-Password-123'
const NEW_PASSWORD = 'New-Password-456'

const addUser = async (id) => {
    const user = {
        id,
        name: `Test ${id}`,
        email: `${id}@example.invalid`,
        role: 'customer',
        email_verified: true,
        password: await bcrypt.hash(CURRENT_PASSWORD, 4),
        hashed_refresh_token: 'existing-refresh-token-hash',
    }
    state.users.set(id, user)
    return user
}

const startServer = async (t) => {
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
    }))
    return `http://127.0.0.1:${server.address().port}`
}

const sendChangePassword = (baseUrl, { userId, body, authenticated = true }) => new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Connection: 'close',
    }
    if (authenticated) {
        headers.Authorization = `Bearer ${jwt.sign(
            { userId },
            env.jwtSecret,
            { algorithm: 'HS256' }
        )}`
    }

    const request = httpRequest({
        host: '127.0.0.1',
        port: new URL(baseUrl).port,
        path: '/api/auth/change-password',
        method: 'POST',
        headers,
        agent: false,
    }, (response) => {
        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8')
            resolve({
                status: response.statusCode,
                headers: response.headers,
                body: text ? JSON.parse(text) : null,
            })
        })
    })

    request.on('error', reject)
    request.end(payload)
})

const wrongPasswordBody = {
    currentPassword: 'wrong-current-password',
    newPassword: NEW_PASSWORD,
}

test('change-password route authenticates before limiter, validation, and controller', () => {
    const route = authRoutes.stack.find((layer) =>
        layer.route?.path === '/change-password' && layer.route.methods.post
    )?.route
    assert.ok(route)

    const handlers = route.stack.map(({ handle }) => handle)
    assert.equal(handlers.length, 4)
    assert.equal(handlers[0], auth)
    assert.equal(handlers[1], authRoutesModule.changePasswordLimiter)
    assert.equal(handlers[3], authController.changePassword)
})

test('five wrong current passwords return 400, then the sixth attempt is rate-limited', async (t) => {
    const userId = 'wrong-password-budget-user'
    await addUser(userId)
    const baseUrl = await startServer(t)

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await sendChangePassword(baseUrl, { userId, body: wrongPasswordBody })
        assert.equal(response.status, 400)
        assert.equal(response.body.message, 'Current password is incorrect')
        assert.equal(response.body.code, 'CURRENT_PASSWORD_INCORRECT')
    }

    const limited = await sendChangePassword(baseUrl, { userId, body: wrongPasswordBody })
    assert.equal(limited.status, 429)
    assert.deepEqual(limited.body, {
        message: 'Too many password change attempts. Please try again later.',
    })
})

test('validation failures count toward the change-password failure limit', async (t) => {
    const userId = 'validation-budget-user'
    await addUser(userId)
    const baseUrl = await startServer(t)
    const invalidBody = { currentPassword: CURRENT_PASSWORD, newPassword: 'weak' }

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await sendChangePassword(baseUrl, { userId, body: invalidBody })
        assert.equal(response.status, 400)
    }

    const limited = await sendChangePassword(baseUrl, { userId, body: wrongPasswordBody })
    assert.equal(limited.status, 429)
})

test('successful password changes do not consume the failure budget', async (t) => {
    const userId = 'successful-change-budget-user'
    await addUser(userId)
    const baseUrl = await startServer(t)

    const success = await sendChangePassword(baseUrl, {
        userId,
        body: { currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD },
    })
    assert.equal(success.status, 200)
    assert.deepEqual(success.body, { message: 'Password changed successfully' })
    assert.equal(state.users.get(userId).hashed_refresh_token, null)

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await sendChangePassword(baseUrl, { userId, body: wrongPasswordBody })
        assert.equal(response.status, 400)
    }

    const limited = await sendChangePassword(baseUrl, { userId, body: wrongPasswordBody })
    assert.equal(limited.status, 429)
})

test('different users have independent change-password failure counters', async (t) => {
    const firstUserId = 'independent-counter-user-one'
    const secondUserId = 'independent-counter-user-two'
    await addUser(firstUserId)
    await addUser(secondUserId)
    const baseUrl = await startServer(t)

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await sendChangePassword(baseUrl, {
            userId: firstUserId,
            body: wrongPasswordBody,
        })
        assert.equal(response.status, 400)
    }

    const blockedFirstUser = await sendChangePassword(baseUrl, {
        userId: firstUserId,
        body: wrongPasswordBody,
    })
    assert.equal(blockedFirstUser.status, 429)

    const secondUser = await sendChangePassword(baseUrl, {
        userId: secondUserId,
        body: wrongPasswordBody,
    })
    assert.equal(secondUser.status, 400)
})

test('unauthenticated change-password requests do not reach or consume the limiter', async (t) => {
    const userId = 'unauthenticated-does-not-count-user'
    await addUser(userId)
    const baseUrl = await startServer(t)

    for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await sendChangePassword(baseUrl, {
            userId,
            body: wrongPasswordBody,
            authenticated: false,
        })
        assert.equal(response.status, 401)
        assert.equal(response.headers['ratelimit-limit'], undefined)
    }

    const authenticated = await sendChangePassword(baseUrl, { userId, body: wrongPasswordBody })
    assert.equal(authenticated.status, 400)
})
