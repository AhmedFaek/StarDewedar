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

const { refreshUnverifiedRegistration } = await import('../src/modules/auth/auth.repository.js')

test('refreshUnverifiedRegistration sends exact atomic eligibility predicates to Prisma', async () => {
    const now = new Date('2026-11-05T12:00:00.000Z')
    const data = {
        name: 'Updated Name',
        password: 'hashed-password',
        phone_number: null,
        whatsapp_number: null,
        company_name: null,
        reset_password_token: null,
        reset_password_expires: null,
        hashed_refresh_token: null,
        email_verification_hash: 'hashed-code',
        email_verification_expires_at: new Date('2026-11-05T12:15:00.000Z'),
        email_verification_attempts: 0,
        email_verification_last_sent: now,
    }

    const result = await refreshUnverifiedRegistration('user-id', data, now, 60)

    assert.equal(result.count, 1)
    assert.deepEqual(updateManyCalls, [{
        where: {
            id: 'user-id',
            email_verified: false,
            AND: [
                {
                    OR: [
                        { email_verification_hash: null },
                        { email_verification_expires_at: null },
                        { email_verification_expires_at: { lte: now } },
                    ],
                },
                {
                    OR: [
                        { email_verification_last_sent: null },
                        {
                            email_verification_last_sent: {
                                lte: new Date('2026-11-05T11:59:00.000Z'),
                            },
                        },
                    ],
                },
            ],
        },
        data,
    }])
})
