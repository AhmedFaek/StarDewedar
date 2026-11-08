import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const quoteRepoUrl = new URL('../src/modules/quoteRequests/quote.repository.js', import.meta.url).href
const visitRepoUrl = new URL('../src/modules/visitRequests/visit.repository.js', import.meta.url).href
const boqRepoUrl = new URL('../src/modules/boqRequests/boq.repository.js', import.meta.url).href

const state = { calls: [] }
const history = (type) => async (userId) => {
    state.calls.push({ type, method: 'findByUserId', userId })
    return [{ id: `${type}-request`, user_id: userId, email: 'customer@example.invalid' }]
}

mock.module(userRepoUrl, {
    exports: {
        findUserById: async () => {
            assert.fail('Customer history must not look up the user email')
        },
    },
})
mock.module(quoteRepoUrl, {
    exports: {
        findByEmail: async () => {
            state.calls.push({ type: 'quote', method: 'findByEmail' })
            return []
        },
        findByUserId: history('quote'),
    },
})
mock.module(visitRepoUrl, {
    exports: {
        findByEmail: async () => {
            state.calls.push({ type: 'visit', method: 'findByEmail' })
            return []
        },
        findByUserId: history('visit'),
    },
})
mock.module(boqRepoUrl, {
    exports: {
        findByEmail: async () => {
            state.calls.push({ type: 'boq', method: 'findByEmail' })
            return []
        },
        findByUserId: history('boq'),
    },
})

const { getMyQuotes, getMyVisits, getMyBOQs } = await import('../src/modules/users/user.controller.js')

test('customer request history filters by user_id only and removes it from response DTOs', async () => {
    state.calls = []
    const handlers = [
        ['quote', getMyQuotes],
        ['visit', getMyVisits],
        ['boq', getMyBOQs],
    ]

    for (const [type, handler] of handlers) {
        let body
        await handler(
            { user: { userId: 'customer-id' } },
            { json(value) { body = value; return this } },
            (error) => assert.ifError(error)
        )

        assert.deepEqual(body, [{
            id: `${type}-request`,
            email: 'customer@example.invalid',
        }])
        assert.equal(Object.hasOwn(body[0], 'user_id'), false)
    }

    assert.deepEqual(state.calls, [
        { type: 'quote', method: 'findByUserId', userId: 'customer-id' },
        { type: 'visit', method: 'findByUserId', userId: 'customer-id' },
        { type: 'boq', method: 'findByUserId', userId: 'customer-id' },
    ])
})
