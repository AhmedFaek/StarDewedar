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

const {
    resetVerificationResendCooldown,
    rollbackVerificationCodeAfterEmailFailure,
} = await import('../src/modules/auth/auth.repository.js')

test('resend cooldown reset matches the timestamp written by the failed request', async () => {
    updateManyCalls.length = 0
    const expectedTimestamp = new Date('2026-11-05T12:00:00.123Z')

    await resetVerificationResendCooldown('user-id', expectedTimestamp)

    assert.deepEqual(updateManyCalls, [{
        where: {
            id: 'user-id',
            email_verified: false,
            email_verification_last_sent: expectedTimestamp,
        },
        data: { email_verification_last_sent: null },
    }])
})

test('failed verification email rollback matches this request and restores prior code state', async () => {
    updateManyCalls.length = 0
    const writtenLastSent = new Date('2026-11-05T12:00:00.123Z')
    const previousState = {
        hash: 'previous-hash',
        expiresAt: new Date('2026-11-05T11:55:00.000Z'),
        attempts: 3,
        lastSent: new Date('2026-11-05T11:40:00.000Z'),
    }

    await rollbackVerificationCodeAfterEmailFailure('user-id', {
        writtenHash: 'request-hash',
        writtenLastSent,
        previousState,
    })

    assert.deepEqual(updateManyCalls, [{
        where: {
            id: 'user-id',
            email_verified: false,
            email_verification_hash: 'request-hash',
            email_verification_last_sent: writtenLastSent,
        },
        data: {
            email_verification_hash: 'previous-hash',
            email_verification_expires_at: previousState.expiresAt,
            email_verification_attempts: 3,
            email_verification_last_sent: null,
        },
    }])
})
