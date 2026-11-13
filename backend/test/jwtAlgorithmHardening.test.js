import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { mock, test } from 'node:test'

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'jwt-algorithm-access-test-secret',
    JWT_REFRESH_SECRET: 'jwt-algorithm-refresh-test-secret',
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
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href
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

mock.module(authRepoUrl, { exports: {} })
mock.module(emailValidationUrl, {
    exports: {
        normalizeEmail: (email) => email.trim().toLowerCase(),
        validateCustomerEmail: async (email) => ({ isValid: true, normalizedEmail: email }),
    },
})
mock.module(mailerUrl, { exports: { sendEmail: async () => ({}) } })

const [{ default: auth, optionalAuth }, { refreshToken, login }, { default: env }] = await Promise.all([
    import('../src/middleware/auth.middleware.js'),
    import('../src/modules/auth/auth.service.js'),
    import('../src/config/env.js'),
])

const createUser = (overrides = {}) => {
    const user = {
        id: 'jwt-user',
        name: 'JWT Test User',
        email: 'jwt-test@example.invalid',
        role: 'customer',
        email_verified: true,
        password: '',
        hashed_refresh_token: null,
        ...overrides,
    }
    state.users.set(user.id, user)
    return user
}

const makeResponse = () => ({
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
})

const invokeAuth = async (middleware, token) => {
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = makeResponse()
    let nextError
    let nextCalls = 0
    await middleware(req, res, (error) => {
        nextError = error
        nextCalls += 1
    })
    return { req, res, nextError, nextCalls }
}

const accessToken = (payload, algorithm = 'HS256') => jwt.sign(
    payload,
    env.jwtSecret,
    { algorithm }
)

const refreshTokenFor = (payload, algorithm = 'HS256') => jwt.sign(
    payload,
    env.jwtRefreshSecret,
    { algorithm }
)

const unsignedToken = (payload) => jwt.sign(payload, null, { algorithm: 'none' })

const tamperSignature = (token) => {
    const [header, payload, signature] = token.split('.')
    return `${header}.${payload}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`
}

const invalidAccessTokens = () => [
    unsignedToken({ userId: 'jwt-user' }),
    accessToken({ userId: 'jwt-user' }, 'HS512'),
    tamperSignature(accessToken({ userId: 'jwt-user' })),
]

test('access and optional auth accept a normal HS256 access token', async () => {
    createUser()
    const token = accessToken({ userId: 'jwt-user' })

    const required = await invokeAuth(auth, token)
    assert.equal(required.nextCalls, 1)
    assert.equal(required.nextError, undefined)
    assert.deepEqual(required.req.user, {
        userId: 'jwt-user',
        role: 'customer',
        name: 'JWT Test User',
    })

    const optional = await invokeAuth(optionalAuth, token)
    assert.equal(optional.nextCalls, 1)
    assert.equal(optional.nextError, undefined)
    assert.deepEqual(optional.req.user, required.req.user)
})

test('access and optional auth reject none, HS512, and tampered-signature tokens', async () => {
    createUser()

    for (const token of invalidAccessTokens()) {
        const required = await invokeAuth(auth, token)
        assert.equal(required.res.statusCode, 401)
        assert.deepEqual(required.res.body, { message: 'Invalid token' })
        assert.equal(required.nextCalls, 0)

        const optional = await invokeAuth(optionalAuth, token)
        assert.equal(optional.res.statusCode, 401)
        assert.deepEqual(optional.res.body, {
            success: false,
            code: 'OPTIONAL_AUTH_INVALID',
            message: 'Invalid access token',
        })
        assert.equal(optional.nextCalls, 0)
    }
})

test('refresh rejects none, HS512, and tampered signatures, and accepts normal HS256 tokens', async () => {
    const user = createUser()
    const invalidTokens = [
        unsignedToken({ userId: user.id }),
        refreshTokenFor({ userId: user.id }, 'HS512'),
        tamperSignature(refreshTokenFor({ userId: user.id })),
    ]

    for (const token of invalidTokens) {
        await assert.rejects(refreshToken(token), { message: 'Invalid refresh token' })
    }

    const password = 'A strong test password 123'
    user.password = await bcrypt.hash(password, 4)
    const loginResult = await login(user.email, password)
    assert.equal(jwt.decode(loginResult.accessToken, { complete: true }).header.alg, 'HS256')
    assert.equal(jwt.decode(loginResult.refreshToken, { complete: true }).header.alg, 'HS256')

    const refreshed = await refreshToken(loginResult.refreshToken)
    assert.equal(jwt.decode(refreshed.accessToken, { complete: true }).header.alg, 'HS256')
    assert.equal(jwt.decode(refreshed.refreshToken, { complete: true }).header.alg, 'HS256')
})
