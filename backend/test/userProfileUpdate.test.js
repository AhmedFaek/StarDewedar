import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import jwt from 'jsonwebtoken'
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
    user: {
        id: 'user-id',
        name: 'Original Name',
        email: 'customer@example.com',
        role: 'customer',
        phone_number: null,
        whatsapp_number: null,
        company_name: null,
        password: 'password-secret',
        email_verified: true,
        email_verification_hash: null,
        email_verification_attempts: 0,
        hashed_refresh_token: 'refresh-secret',
        reset_password_token: 'reset-secret',
    },
    updates: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const quoteRepoUrl = new URL('../src/modules/quoteRequests/quote.repository.js', import.meta.url).href
const visitRepoUrl = new URL('../src/modules/visitRequests/visit.repository.js', import.meta.url).href
const boqRepoUrl = new URL('../src/modules/boqRequests/boq.repository.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserById: async () => state.user,
        updateUser: async (id, data) => {
            state.updates.push({ id, data })
            Object.assign(state.user, data)
            return state.user
        },
    },
})
mock.module(quoteRepoUrl, { exports: {} })
mock.module(visitRepoUrl, { exports: {} })
mock.module(boqRepoUrl, { exports: {} })

const { default: userRoutes } = await import('../src/modules/users/user.routes.js')
const { setUserLookup } = await import('../src/middleware/auth.middleware.js')

setUserLookup(async (id) => id === state.user.id ? state.user : null)

test('PATCH /api/users/me authenticates and updates only validated editable fields', async (t) => {
    const app = express()
    app.use(express.json())
    app.use('/api/users', userRoutes)

    const server = app.listen(0)
    await once(server, 'listening')
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const baseUrl = `http://127.0.0.1:${server.address().port}/api/users/me`
    const token = jwt.sign(
        { userId: state.user.id },
        'test-secret',
        { algorithm: 'HS256' }
    )
    const send = (method, body, authenticated = true) => fetch(baseUrl, {
        method,
        headers: {
            ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const unauthenticated = await send('PATCH', { name: 'Updated Name' }, false)
    assert.equal(unauthenticated.status, 401)

    for (const field of ['role', 'email', 'email_verified', 'password', 'unexpected']) {
        const response = await send('PATCH', { name: 'Updated Name', [field]: 'forbidden' })
        assert.equal(response.status, 400, `${field} should be rejected`)
    }

    const emptyBody = await send('PATCH', {})
    assert.equal(emptyBody.status, 400)
    assert.equal(state.updates.length, 0)

    const updated = await send('PATCH', {
        name: '  Updated Name  ',
        phone_number: ' 01287879794 ',
        whatsapp_number: '+201287879794',
        company_name: '  Example Co.  ',
    })
    assert.equal(updated.status, 200)
    const updatedProfile = await updated.json()
    assert.deepEqual(state.updates[0], {
        id: 'user-id',
        data: {
            name: 'Updated Name',
            phone_number: '01287879794',
            whatsapp_number: '+201287879794',
            company_name: 'Example Co.',
        },
    })
    assert.deepEqual(updatedProfile, {
        id: 'user-id',
        name: 'Updated Name',
        email: 'customer@example.com',
        role: 'customer',
        phone_number: '01287879794',
        whatsapp_number: '+201287879794',
        company_name: 'Example Co.',
    })
    assert.equal(
        Object.keys(updatedProfile).some((key) => /password|token|verification/u.test(key)),
        false
    )

    const cleared = await send('PATCH', {
        name: 'Cleared Name',
        phone_number: null,
        whatsapp_number: '',
        company_name: '   ',
    })
    assert.equal(cleared.status, 200)
    assert.deepEqual(state.updates[1].data, {
        name: 'Cleared Name',
        phone_number: null,
        whatsapp_number: null,
        company_name: null,
    })
    const clearedProfile = await cleared.json()
    assert.deepEqual(clearedProfile, {
        id: 'user-id',
        name: 'Cleared Name',
        email: 'customer@example.com',
        role: 'customer',
        phone_number: null,
        whatsapp_number: null,
        company_name: null,
    })
    assert.equal(
        Object.keys(clearedProfile).some((key) => /password|token|verification/u.test(key)),
        false
    )

    for (const name of ['Another Name', 'Last Allowed Name']) {
        const withinLimit = await send('PATCH', { name })
        assert.equal(withinLimit.status, 200)
    }
    const rateLimited = await send('PATCH', { name: 'Rate Limited Name' })
    assert.equal(rateLimited.status, 429)
})
