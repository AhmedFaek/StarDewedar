import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const updateManyCalls = []
const prismaUrl = new URL('../src/utils/prisma.js', import.meta.url).href

mock.module(prismaUrl, {
    exports: {
        default: {
            user: {
                updateMany: async (args) => {
                    updateManyCalls.push(args)
                    return { count: 1 }
                },
            },
        },
    },
})

const { resetPassword } = await import('../src/modules/auth/auth.repository.js')

test('resetPassword atomically redeems token and verifies an unverified customer in one update', async () => {
    const before = Date.now()
    const result = await resetPassword(
        'user-id',
        'hashed-reset-token',
        'hashed-password',
        { verifyEmail: true }
    )
    const after = Date.now()

    assert.equal(result.count, 1)
    assert.equal(updateManyCalls.length, 1)
    const [{ where, data }] = updateManyCalls
    assert.deepEqual(where.id, 'user-id')
    assert.equal(where.reset_password_token, 'hashed-reset-token')
    assert.ok(where.reset_password_expires.gt.getTime() >= before)
    assert.ok(where.reset_password_expires.gt.getTime() <= after)
    assert.deepEqual(data, {
        password: 'hashed-password',
        reset_password_token: null,
        reset_password_expires: null,
        hashed_refresh_token: null,
        email_verified: true,
        email_verification_hash: null,
        email_verification_expires_at: null,
        email_verification_attempts: 0,
        email_verification_last_sent: null,
    })
})

test('resetPassword keeps verification fields unchanged for verified accounts', async () => {
    updateManyCalls.length = 0

    await resetPassword(
        'verified-user-id',
        'hashed-reset-token',
        'hashed-password',
        { verifyEmail: false }
    )

    assert.equal(updateManyCalls.length, 1)
    assert.deepEqual(updateManyCalls[0].data, {
        password: 'hashed-password',
        reset_password_token: null,
        reset_password_expires: null,
        hashed_refresh_token: null,
    })
})
