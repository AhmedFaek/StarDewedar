import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const state = { events: [], options: null }
const prismaUrl = new URL('../src/utils/prisma.js', import.meta.url).href
const fakePrisma = {
    $transaction: async (callback, options) => {
        state.options = options
        const transaction = {
            $queryRaw: async (strings, key) => {
                state.events.push(['lock', strings.join('?'), key])
                return []
            },
            user: {
                count: async (query) => {
                    state.events.push(['count', query])
                    return 2
                },
            },
        }
        return callback(transaction)
    },
}

mock.module(prismaUrl, { exports: { default: fakePrisma } })

const { SUPER_ADMIN_ADVISORY_LOCK_KEY, withSuperAdminLock } = await import('../src/utils/superAdminLock.js')

test('super-admin lock takes the advisory lock before counting inside a bounded interactive transaction', async () => {
    state.events.length = 0
    state.options = null
    let received

    const result = await withSuperAdminLock(async (context) => {
        state.events.push(['operation'])
        received = context
        return 'completed'
    })

    assert.equal(result, 'completed')
    assert.deepEqual(state.events.map(([event]) => event), ['lock', 'count', 'operation'])
    assert.match(state.events[0][1], /pg_advisory_xact_lock.*IS NULL/u)
    assert.equal(state.events[0][2], SUPER_ADMIN_ADVISORY_LOCK_KEY)
    assert.deepEqual(state.events[1][1], { where: { role: 'super_admin' } })
    assert.equal(received.superAdminCount, 2)
    assert.deepEqual(state.options, { maxWait: 5000, timeout: 10000 })
})
