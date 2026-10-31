import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    getAllowedEgyptianPhoneInput,
    isAllowedEgyptianPhoneInput,
    isValidEgyptianPhoneNumber,
} from '../../shared/egyptianPhone.js'
import {
    createUserSchema,
    registerSchema,
} from '../src/modules/auth/auth.validation.js'
import { createVisitRequestSchema } from '../src/modules/visitRequests/visit.validation.js'
import { createQuoteRequestSchema } from '../src/modules/quoteRequests/quote.validation.js'
import { createBOQRequestSchema } from '../src/modules/boqRequests/boq.validation.js'
import { createContactSchema } from '../src/modules/contactMessages/contact.validation.js'

const validPhones = ['01287879794', '+201287879794']
const invalidPhones = [
    '0128787979',
    '012878797941',
    '02287879794',
    '+20128787979',
    '+2012878797941',
    '01287abc794',
]

test('accepts only the requested Egyptian phone number formats', () => {
    for (const phone of validPhones) {
        assert.equal(isValidEgyptianPhoneNumber(phone), true, `${phone} should be valid`)
    }

    for (const phone of invalidPhones) {
        assert.equal(isValidEgyptianPhoneNumber(phone), false, `${phone} should be invalid`)
    }
})

test('phone input guard supports valid pastes and rejects unsupported pasted characters or lengths', () => {
    for (const phone of validPhones) {
        assert.equal(isAllowedEgyptianPhoneInput(phone), true, `${phone} should be accepted as input`)
        assert.equal(
            getAllowedEgyptianPhoneInput({ currentTarget: { value: phone } }),
            phone,
            `${phone} should be preserved when pasted`
        )
    }

    assert.equal(isAllowedEgyptianPhoneInput('012878797941'), false)
    assert.equal(isAllowedEgyptianPhoneInput('+2012878797941'), false)
    assert.equal(isAllowedEgyptianPhoneInput('01287abc794'), false)
    assert.equal(isAllowedEgyptianPhoneInput('+20 1287879794'), false)
    assert.equal(getAllowedEgyptianPhoneInput({ currentTarget: { value: '01287abc794' } }), null)
    assert.equal(getAllowedEgyptianPhoneInput({ currentTarget: { value: '012878797941' } }), null)
})

test('all required backend phone schemas accept both formats and reject invalid formats', () => {
    const requiredPhoneSchemas = [
        createVisitRequestSchema.shape.phone_number,
        createQuoteRequestSchema.shape.phone,
        createBOQRequestSchema.shape.phone,
        createContactSchema.shape.phone_number,
    ]

    for (const schema of requiredPhoneSchemas) {
        for (const phone of validPhones) assert.equal(schema.safeParse(phone).success, true)
        for (const phone of invalidPhones) assert.equal(schema.safeParse(phone).success, false)
    }
})

test('contact schema requires a valid Egyptian phone number', () => {
    const contact = {
        first_name: 'Example',
        last_name: 'Customer',
        email: 'customer@example.invalid',
        message: 'Please contact me about your services.',
    }

    assert.equal(createContactSchema.safeParse(contact).success, false)

    for (const phone of validPhones) {
        assert.equal(
            createContactSchema.safeParse({ ...contact, phone_number: phone }).success,
            true,
            `${phone} should be accepted`
        )
    }

    for (const phone of invalidPhones) {
        assert.equal(
            createContactSchema.safeParse({ ...contact, phone_number: phone }).success,
            false,
            `${phone} should be rejected`
        )
    }
})

test('optional account and Contact WhatsApp phone fields accept blank values and validate supplied values', () => {
    const optionalPhoneSchemas = [
        registerSchema.shape.phone_number,
        registerSchema.shape.whatsapp_number,
        createUserSchema.shape.phone_number,
        createUserSchema.shape.whatsapp_number,
        createContactSchema.shape.whatsapp_number,
    ]

    for (const schema of optionalPhoneSchemas) {
        assert.equal(schema.safeParse('').success, true)
        for (const phone of validPhones) assert.equal(schema.safeParse(phone).success, true)
        for (const phone of invalidPhones) assert.equal(schema.safeParse(phone).success, false)
    }
})
