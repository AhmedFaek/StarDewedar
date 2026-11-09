import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const state = { persisted: [], sent: [] }
const repositoryUrl = new URL('../src/modules/contactMessages/contact.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href

mock.module(repositoryUrl, {
    exports: {
        createContactMessage: async (data) => {
            state.persisted.push(data)
            return { id: 'contact-record-id', ...data }
        },
        getAllMessages: async () => [],
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async (message) => {
            state.sent.push(message)
            throw new Error('mail transport failed')
        },
    },
})

const { createContact } = await import('../src/modules/contactMessages/contact.service.js')

test('contact row remains successful on mail failure and logs only safe identifiers', async (t) => {
    state.persisted = []
    state.sent = []
    const logEntries = []
    t.mock.method(console, 'error', (...args) => logEntries.push(args))
    const contact = {
        first_name: 'Private',
        last_name: 'Customer',
        email: 'private.customer@example.invalid',
        phone_number: '01287879794',
        message: 'Private message contents that must not be logged.',
    }

    const result = await createContact(contact)

    assert.deepEqual(state.persisted, [contact])
    assert.deepEqual(result, { id: 'contact-record-id', ...contact })
    assert.equal(state.sent.length, 1)
    assert.deepEqual(logEntries, [[
        'Contact staff notification failed',
        {
            event: 'contact_notification_failed',
            contactId: 'contact-record-id',
            errorName: 'Error',
        },
    ]])
    assert.doesNotMatch(JSON.stringify(logEntries), /private\.customer|Private message/)
})
