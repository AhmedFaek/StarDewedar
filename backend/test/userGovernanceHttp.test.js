import assert from 'node:assert/strict'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mock, test } from 'node:test'

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'user-governance-http-access-test-secret',
    JWT_REFRESH_SECRET: 'user-governance-http-refresh-test-secret',
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
const authMiddlewareUrl = new URL('../src/middleware/auth.middleware.js', import.meta.url).href
const rolesMiddlewareUrl = new URL('../src/middleware/roles.middleware.js', import.meta.url).href
const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const superAdminLockUrl = new URL('../src/utils/superAdminLock.js', import.meta.url).href

const fakeAuth = (req, res, next) => {
    const userId = req.headers['x-test-user-id']
    const role = req.headers['x-test-user-role']
    if (typeof userId !== 'string' || typeof role !== 'string') {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    req.user = { userId, role }
    return next()
}

const allowPermissionForTest = () => (_req, _res, next) => next()

const fakeTransaction = {
    user: {
        findUnique: async ({ where }) => {
            const user = state.users.get(where.id)
            return user ? { id: user.id, role: user.role } : null
        },
        delete: async ({ where }) => {
            const user = state.users.get(where.id)
            if (!user) {
                const error = new Error('Record to delete does not exist')
                error.code = 'P2025'
                throw error
            }
            state.users.delete(where.id)
            return user
        },
    },
}

mock.module(authMiddlewareUrl, {
    exports: {
        default: fakeAuth,
        optionalAuth: fakeAuth,
        setUserLookup: () => {},
    },
})
mock.module(rolesMiddlewareUrl, {
    exports: {
        requirePermission: allowPermissionForTest,
        requireRole: allowPermissionForTest,
    },
})
mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async (email) => (
            [...state.users.values()].find((user) => user.email === email) || null
        ),
        findUserById: async (id) => state.users.get(id) || null,
        deleteUserByIdUnlessSuperAdmin: async (id) => {
            const user = state.users.get(id)
            if (!user || user.role === 'super_admin') return { count: 0 }
            state.users.delete(id)
            return { count: 1 }
        },
        createUser: async (data) => {
            const user = { id: randomUUID(), ...data }
            state.users.set(user.id, user)
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
mock.module(superAdminLockUrl, {
    exports: {
        withSuperAdminLock: async (operation) => {
            const superAdminCount = [...state.users.values()]
                .filter((user) => user.role === 'super_admin').length
            return operation({ transaction: fakeTransaction, superAdminCount })
        },
    },
})

const { default: app } = await import('../src/app.js')

const addUser = (id, role) => {
    const user = {
        id,
        name: `Test ${id}`,
        email: `${id}@example.invalid`,
        password: 'stored-fake-test-hash',
        role,
        email_verified: true,
    }
    state.users.set(id, user)
    return user
}

const reset = () => state.users.clear()

const startServer = async (t) => {
    const server = app.listen(0, '127.0.0.1')
    await once(server, 'listening')
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    return `http://127.0.0.1:${server.address().port}`
}

const send = async (baseUrl, path, {
    method = 'GET',
    userId,
    role,
    body,
} = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(userId ? { 'x-test-user-id': userId } : {}),
            ...(role ? { 'x-test-user-role': role } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return { status: response.status, body: await response.json() }
}

test('DELETE returns 409 LAST_SUPER_ADMIN with a message when only one admin remains', async (t) => {
    reset()
    const target = addUser(randomUUID(), 'super_admin')
    const baseUrl = await startServer(t)
    t.mock.method(console, 'error', () => {})

    const response = await send(baseUrl, `/api/users/${target.id}`, {
        method: 'DELETE',
        userId: randomUUID(),
        role: 'super_admin',
    })

    assert.equal(response.status, 409)
    assert.deepEqual(response.body, {
        message: 'The last super admin cannot be deleted or demoted.',
        code: 'LAST_SUPER_ADMIN',
    })
    assert.equal(state.users.has(target.id), true)
})

test('DELETE returns 403 SUPER_ADMIN_DELETE_FORBIDDEN to a non-super-admin reaching the service', async (t) => {
    reset()
    const target = addUser(randomUUID(), 'super_admin')
    const actor = addUser(randomUUID(), 'catalog_manager')
    const baseUrl = await startServer(t)
    t.mock.method(console, 'error', () => {})

    const response = await send(baseUrl, `/api/users/${target.id}`, {
        method: 'DELETE',
        userId: actor.id,
        role: actor.role,
    })

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
        message: 'Only a super admin can delete a super admin account.',
        code: 'SUPER_ADMIN_DELETE_FORBIDDEN',
    })
    assert.equal(state.users.has(target.id), true)
})

test('DELETE returns 400 SELF_DELETE_NOT_ALLOWED for self-deletion', async (t) => {
    reset()
    const actor = addUser(randomUUID(), 'super_admin')
    const baseUrl = await startServer(t)
    t.mock.method(console, 'error', () => {})

    const response = await send(baseUrl, `/api/users/${actor.id}`, {
        method: 'DELETE',
        userId: actor.id,
        role: actor.role,
    })

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, {
        message: 'You cannot delete your own account.',
        code: 'SELF_DELETE_NOT_ALLOWED',
    })
    assert.equal(state.users.has(actor.id), true)
})

test('DELETE returns 404 USER_NOT_FOUND for a missing target', async (t) => {
    reset()
    const baseUrl = await startServer(t)
    t.mock.method(console, 'error', () => {})

    const response = await send(baseUrl, `/api/users/${randomUUID()}`, {
        method: 'DELETE',
        userId: randomUUID(),
        role: 'super_admin',
    })

    assert.equal(response.status, 404)
    assert.deepEqual(response.body, {
        message: 'User not found.',
        code: 'USER_NOT_FOUND',
    })
})

test('DELETE success retains the existing message-only response shape', async (t) => {
    reset()
    const target = addUser(randomUUID(), 'catalog_manager')
    const baseUrl = await startServer(t)

    const response = await send(baseUrl, `/api/users/${target.id}`, {
        method: 'DELETE',
        userId: randomUUID(),
        role: 'super_admin',
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { message: 'User deleted successfully.' })
    assert.equal(state.users.has(target.id), false)
})

test('POST create-user returns 403 SUPER_ADMIN_CREATE_FORBIDDEN to a non-super-admin', async (t) => {
    reset()
    const baseUrl = await startServer(t)
    t.mock.method(console, 'error', () => {})

    const response = await send(baseUrl, '/api/auth/create-user', {
        method: 'POST',
        userId: randomUUID(),
        role: 'catalog_manager',
        body: {
            name: 'Blocked Admin',
            email: 'blocked-admin@example.invalid',
            password: 'A fake test password 123',
            role: 'super_admin',
        },
    })

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
        message: 'Only a super admin can create a super admin account.',
        code: 'SUPER_ADMIN_CREATE_FORBIDDEN',
    })
    assert.equal(state.users.size, 0)
})

test('POST create-user lets a super_admin create a catalog_manager with the existing response shape', async (t) => {
    reset()
    const baseUrl = await startServer(t)

    const response = await send(baseUrl, '/api/auth/create-user', {
        method: 'POST',
        userId: randomUUID(),
        role: 'super_admin',
        body: {
            name: 'Catalog Manager',
            email: 'catalog-manager@example.invalid',
            password: 'A fake test password 123',
            role: 'catalog_manager',
        },
    })

    assert.equal(response.status, 201)
    assert.equal(response.body.role, 'catalog_manager')
    assert.equal(response.body.email, 'catalog-manager@example.invalid')
    assert.equal(response.body.email_verified, true)
    assert.equal(Object.hasOwn(response.body, 'password'), false)
    assert.equal(Object.keys(response.body).includes('hashed_refresh_token'), false)
})
