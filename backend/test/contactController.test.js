import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const serviceUrl = new URL('../src/modules/contactMessages/contact.service.js', import.meta.url).href
const state = { calls: [] }

mock.module(serviceUrl, {
    exports: {
        createContact: async (data) => {
            state.calls.push(data)
            return { id: 'contact-id' }
        },
        getMessages: async () => [],
    },
})

const { createContact } = await import('../src/modules/contactMessages/contact.controller.js')

const createResponse = () => ({
    statusCode: 200,
    body: undefined,
    status(statusCode) {
        this.statusCode = statusCode
        return this
    },
    json(body) {
        this.body = body
        return this
    },
})

test('contact create passes only parsed schema fields to the service', async () => {
    state.calls = []
    const body = {
        first_name: 'Contact',
        last_name: 'Customer',
        email: 'contact@example.invalid',
        phone_number: '01287879794',
        whatsapp_number: '+201287879794',
        message: 'Please contact me about a project.',
        id: 'attacker-controlled-id',
        created_at: 'attacker-controlled-date',
    }
    const res = createResponse()

    await createContact({ body }, res)

    assert.deepEqual(state.calls, [{
        first_name: 'Contact',
        last_name: 'Customer',
        email: 'contact@example.invalid',
        phone_number: '01287879794',
        whatsapp_number: '+201287879794',
        message: 'Please contact me about a project.',
    }])
    assert.equal(res.statusCode, 201)
    assert.deepEqual(res.body, {
        message: 'Message sent successfully',
        data: { id: 'contact-id' },
    })
})

test('contact validation failure retains the existing HTTP status and response body', async () => {
    state.calls = []
    const res = createResponse()

    await createContact({ body: {} }, res)

    assert.equal(res.statusCode, 400)
    assert.deepEqual(res.body, { message: 'Validation error' })
    assert.equal(state.calls.length, 0)
})
