import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const calls = []
let currentResetExpiry = null
const prismaUrl = new URL('../src/utils/prisma.js', import.meta.url).href

mock.module(prismaUrl, {
    exports: {
        default: {
            user: {
                updateMany: async (args) => {
                    calls.push(args)
                    const { OR } = args.where
                    const canUpdate = OR.some((condition) => {
                        if (condition.reset_password_expires === null) {
                            return currentResetExpiry === null
                        }
                        return currentResetExpiry !== null
                            && currentResetExpiry <= condition.reset_password_expires.lte
                    })
                    return { count: canUpdate ? 1 : 0 }
                },
            },
        },
    },
})

const { saveResetTokenIfCooldownElapsed } = await import(
    '../src/modules/auth/auth.repository.js'
)

test('saveResetTokenIfCooldownElapsed atomically matches the user and eligible prior expiry', async () => {
    calls.length = 0
    const expiresAt = new Date('2026-11-07T12:15:00.000Z')
    const cooldownExpiryCutoff = new Date('2026-11-07T12:14:00.000Z')
    currentResetExpiry = new Date('2026-11-07T12:14:00.000Z')

    const result = await saveResetTokenIfCooldownElapsed(
        'user-id',
        'new-token-hash',
        expiresAt,
        cooldownExpiryCutoff
    )

    assert.equal(result.count, 1)
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0], {
        where: {
            id: 'user-id',
            OR: [
                { reset_password_expires: null },
                { reset_password_expires: { lte: cooldownExpiryCutoff } },
            ],
        },
        data: {
            reset_password_token: 'new-token-hash',
            reset_password_expires: expiresAt,
        },
    })
})

test('cooldown predicate accepts exactly 60 seconds old, null, and expired tokens, but blocks 59 seconds old', async () => {
    const now = new Date('2026-11-07T12:00:00.000Z')
    const cutoff = new Date('2026-11-07T12:14:00.000Z')
    const expiresAt = new Date('2026-11-07T12:15:00.000Z')
    const cases = [
        ['exactly 60 seconds old', new Date('2026-11-07T12:14:00.000Z'), 1],
        ['59 seconds old', new Date('2026-11-07T12:14:01.000Z'), 0],
        ['null expiry', null, 1],
        ['expired token', new Date('2026-11-07T11:59:59.999Z'), 1],
    ]

    for (const [label, priorExpiry, expectedCount] of cases) {
        calls.length = 0
        currentResetExpiry = priorExpiry
        const result = await saveResetTokenIfCooldownElapsed(
            `user-${label}`,
            'new-token-hash',
            expiresAt,
            cutoff
        )
        assert.equal(result.count, expectedCount, label)
        assert.deepEqual(calls[0].where.OR, [
            { reset_password_expires: null },
            { reset_password_expires: { lte: cutoff } },
        ], label)
        assert.equal(calls[0].where.id, `user-${label}`, label)
        assert.deepEqual(calls[0].data, {
            reset_password_token: 'new-token-hash',
            reset_password_expires: expiresAt,
        }, label)
    }

    assert.equal(now.getTime() + 14 * 60 * 1000, cutoff.getTime())
})
