import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const quoteRepoUrl = new URL('../src/modules/quoteRequests/quote.repository.js', import.meta.url).href
const visitRepoUrl = new URL('../src/modules/visitRequests/visit.repository.js', import.meta.url).href
const boqRepoUrl = new URL('../src/modules/boqRequests/boq.repository.js', import.meta.url).href

const user = {
    id: 'user-id',
    name: 'Test Customer',
    email: 'customer@example.com',
    role: 'customer',
    phone_number: '+201234567890',
    whatsapp_number: '+201234567891',
    company_name: 'Example Co.',
    password: 'password-secret',
    hashed_refresh_token: 'refresh-secret',
    reset_password_token: 'reset-secret',
    reset_password_expires: new Date(),
    email_verified: false,
    email_verification_hash: 'verification-secret',
    email_verification_expires_at: new Date(),
    email_verification_attempts: 4,
    email_verification_last_sent: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
}

mock.module(userRepoUrl, {
    exports: {
        findUserById: async () => user,
    },
})
mock.module(quoteRepoUrl, { exports: {} })
mock.module(visitRepoUrl, { exports: {} })
mock.module(boqRepoUrl, { exports: {} })

const { getMe } = await import('../src/modules/users/user.controller.js')

test('GET /me returns only allowlisted safe profile fields', async () => {
    let responseBody
    const response = {
        json(body) {
            responseBody = body
            return this
        },
        status(statusCode) {
            assert.fail(`Unexpected response status: ${statusCode}`)
        },
    }

    await getMe({ user: { userId: 'user-id' } }, response, (error) => {
        assert.ifError(error)
    })

    assert.deepEqual(responseBody, {
        id: 'user-id',
        name: 'Test Customer',
        email: 'customer@example.com',
        role: 'customer',
        phone_number: '+201234567890',
        whatsapp_number: '+201234567891',
        company_name: 'Example Co.',
    })
    assert.equal(
        Object.keys(responseBody).some((key) => /password|token|verification|created_at|updated_at/u.test(key)),
        false
    )
})
