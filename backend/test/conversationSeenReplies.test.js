import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const t = (iso) => new Date(iso)
const state = { conversations: [], found: null, messages: [], marks: [], lastMessageCalls: [] }
const repoUrl = new URL('../src/modules/conversations/conversation.repository.js', import.meta.url).href

mock.module(repoUrl, {
    exports: {
        findAdminLastOpenByCustomer: async (customerId) => state.conversations.filter((c) => c.customer_id === customerId),
        findByIdForCustomer: async () => state.found,
        findMessages: async () => state.messages,
        markCustomerSeen: async (id, seenAt) => { state.marks.push({ id, seenAt }) },
        updateLastMessage: async (...args) => { state.lastMessageCalls.push(args) },
        validateConversationExists: async () => ({ id: 'c1', customer_id: 'u1', status: 'OPEN' }),
        validateProductExists: async () => ({ id: 'p' }),
        createMessage: async () => ({ id: 'm', created_at: t('2026-01-01T10:00:00.123Z') }),
    },
})

const service = await import('../src/modules/conversations/conversation.service.js')

const reset = () => Object.assign(state, { conversations: [], found: null, messages: [], marks: [], lastMessageCalls: [] })
const conv = (over) => ({ id: 'c', customer_id: 'u1', subject: 's', last_message_at: t('2026-01-01T10:00:00Z'), customer_last_seen_at: null, ...over })

test('unseen replies: null seen, older seen included; equal/newer seen excluded', async () => {
    reset()
    state.conversations = [
        conv({ id: 'a' }),
        conv({ id: 'b', customer_last_seen_at: t('2026-01-01T09:00:00Z') }),
        conv({ id: 'c', customer_last_seen_at: t('2026-01-01T10:00:00Z') }),
        conv({ id: 'd', customer_last_seen_at: t('2026-01-01T11:00:00Z') }),
    ]
    const result = await service.getMyUnseenReplies('u1')
    assert.deepEqual(result.map((r) => r.id), ['a', 'b'])
    assert.deepEqual(Object.keys(result[0]).sort(), ['id', 'last_message_at', 'subject'])
})

test('unseen replies: only the authenticated customer\'s conversations', async () => {
    reset()
    state.conversations = [conv({ id: 'mine' }), conv({ id: 'theirs', customer_id: 'u2' })]
    assert.deepEqual((await service.getMyUnseenReplies('u1')).map((r) => r.id), ['mine'])
})

test('unseen replies: limit applies after filtering seen conversations', async () => {
    reset()
    const seen = Array.from({ length: 15 }, (_, i) => conv({ id: `s${i}`, customer_last_seen_at: t('2026-01-01T10:00:00Z') }))
    state.conversations = [...seen, conv({ id: 'late-unseen' })]
    assert.deepEqual((await service.getMyUnseenReplies('u1')).map((r) => r.id), ['late-unseen'])
})

test('messages fetch marks the newest returned ADMIN message timestamp, not now', async () => {
    reset()
    state.found = conv({ id: 'c1' })
    state.messages = [
        { id: '3', sender_type: 'CUSTOMER', created_at: t('2026-01-01T10:05:00Z') },
        { id: '2', sender_type: 'ADMIN', created_at: t('2026-01-01T10:00:00Z') },
        { id: '1', sender_type: 'ADMIN', created_at: t('2026-01-01T09:00:00Z') },
    ]
    const res = await service.getMyMessages('u1', 'c1', {})
    assert.equal(state.marks.length, 1)
    assert.equal(state.marks[0].seenAt.toISOString(), '2026-01-01T10:00:00.000Z')
    assert.equal('customer_last_seen_at' in res.conversation, false)
})

test('no write when no admin message returned or already seen', async () => {
    reset()
    state.found = conv({ id: 'c1' })
    state.messages = [{ id: '1', sender_type: 'CUSTOMER', created_at: t('2026-01-01T10:00:00Z') }]
    await service.getMyMessages('u1', 'c1', {})
    state.messages = [{ id: '2', sender_type: 'ADMIN', created_at: t('2026-01-01T10:00:00Z') }]
    state.found = conv({ id: 'c1', customer_last_seen_at: t('2026-01-01T10:00:00Z') })
    await service.getMyMessages('u1', 'c1', {})
    assert.equal(state.marks.length, 0)
})

test('newer admin message not in the response is not marked seen', async () => {
    reset()
    state.found = conv({ id: 'c1', last_message_at: t('2026-01-01T10:10:00Z') })
    state.messages = [{ id: '1', sender_type: 'ADMIN', created_at: t('2026-01-01T10:00:00Z') }]
    await service.getMyMessages('u1', 'c1', {})
    assert.equal(state.marks[0].seenAt.toISOString(), '2026-01-01T10:00:00.000Z')
})

test('admin reply keeps last_message_at equal to the message timestamp', async () => {
    reset()
    await service.adminSendMessage('admin', 'c1', { content: 'hi' })
    const [, sender, at] = state.lastMessageCalls[0]
    assert.equal(sender, 'ADMIN')
    assert.equal(at.toISOString(), '2026-01-01T10:00:00.123Z')
})
