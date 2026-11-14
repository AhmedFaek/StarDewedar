import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'create-user-governance-access-secret',
    JWT_REFRESH_SECRET: 'create-user-governance-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    VERIFICATION_CODE_PEPPER: '0123456789abcdef0123456789abcdef',
})

const state = {
    users: [],
    lockCalls: 0,
    transaction: { marker: 'transaction-client' },
    createCalls: [],
}
const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const superAdminLockUrl = new URL('../src/utils/superAdminLock.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async (email) => state.users.find((user) => user.email === email) || null,
        createUser: async (data, database) => {
            state.createCalls.push({ data, database })
            const user = { id: `user-${state.createCalls.length}`, ...data }
            state.users.push(user)
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
            state.lockCalls += 1
            const superAdminCount = state.users.filter((user) => user.role === 'super_admin').length
            return operation({ transaction: state.transaction, superAdminCount })
        },
    },
})

const { createUser } = await import('../src/modules/auth/auth.service.js')

const makeData = (role, email) => ({
    name: 'Governance Test User',
    email,
    password: 'A fake unit-test password 123',
    role,
})

const reset = () => {
    state.users.length = 0
    state.lockCalls = 0
    state.createCalls.length = 0
}

test('non-super-admin service callers cannot create a super_admin', async () => {
    reset()

    await assert.rejects(
        createUser(makeData('super_admin', 'blocked-admin@example.invalid'), {
            userId: 'catalog-actor',
            role: 'catalog_manager',
        }),
        (error) => error.status === 403 && error.code === 'SUPER_ADMIN_CREATE_FORBIDDEN'
    )
    assert.equal(state.lockCalls, 0)
    assert.equal(state.createCalls.length, 0)
})

test('super_admin can create a super_admin through the shared transaction lock', async () => {
    reset()
    const result = await createUser(
        makeData('super_admin', 'new-admin@example.invalid'),
        { userId: 'root-actor', role: 'super_admin' }
    )

    assert.equal(state.lockCalls, 1)
    assert.equal(state.createCalls.length, 1)
    assert.equal(state.createCalls[0].database, state.transaction)
    assert.equal(state.createCalls[0].data.role, 'super_admin')
    assert.equal(state.createCalls[0].data.email, 'new-admin@example.invalid')
    assert.equal(state.createCalls[0].data.email_verified, true)
    assert.match(state.createCalls[0].data.password, /^\$2[aby]\$/u)
    assert.equal(Object.hasOwn(result, 'password'), false)
})

test('super_admin can still create catalog_manager and sales_support_manager without taking the lock', async () => {
    reset()
    const actor = { userId: 'root-actor', role: 'super_admin' }

    for (const [index, role] of ['catalog_manager', 'sales_support_manager'].entries()) {
        const result = await createUser(
            makeData(role, `${role}-${index}@example.invalid`),
            actor
        )
        assert.equal(result.role, role)
        assert.equal(result.email_verified, true)
    }

    assert.equal(state.lockCalls, 0)
    assert.equal(state.createCalls.length, 2)
    assert.ok(state.createCalls.every(({ database }) => database === undefined))
})
