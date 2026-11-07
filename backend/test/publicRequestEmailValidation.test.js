import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import {
    createEmailValidator,
    normalizeEmail as normalizeEmailValue,
} from '../src/utils/emailValidation.service.js'
import { createQuoteRequestSchema } from '../src/modules/quoteRequests/quote.validation.js'
import { createVisitRequestSchema } from '../src/modules/visitRequests/visit.validation.js'
import { createBOQRequestSchema } from '../src/modules/boqRequests/boq.validation.js'
import { createContactSchema } from '../src/modules/contactMessages/contact.validation.js'
import { PUBLIC_REQUEST_SUCCESS_MESSAGES } from '../src/utils/publicRequestProtection.js'

const state = {
    events: [],
    serviceCalls: [],
    emailResult: null,
    fileError: null,
    schemaFailure: null,
    useTransientDns: false,
}

const transientDnsValidator = createEmailValidator({
    resolver: {
        resolveMx: async () => {
            throw Object.assign(new Error('temporary DNS failure'), { code: 'SERVFAIL' })
        },
        resolve4: async () => [],
        resolve6: async () => [],
    },
    logger: { warn() {} },
})

const withSchemaEvent = (schema, name) => ({
    parse(data) {
        state.events.push(`schema:${name}`)
        if (state.schemaFailure === name) return schema.parse({})
        return schema.parse(data)
    },
})

const recordServiceCall = (name, data) => {
    state.events.push(`service:${name}`)
    state.serviceCalls.push({ name, data })
    return { id: `${name}-id`, ...data }
}

const quoteServiceUrl = new URL('../src/modules/quoteRequests/quote.service.js', import.meta.url).href
const visitServiceUrl = new URL('../src/modules/visitRequests/visit.service.js', import.meta.url).href
const boqServiceUrl = new URL('../src/modules/boqRequests/boq.service.js', import.meta.url).href
const contactServiceUrl = new URL('../src/modules/contactMessages/contact.service.js', import.meta.url).href
const quoteSchemaUrl = new URL('../src/modules/quoteRequests/quote.validation.js', import.meta.url).href
const visitSchemaUrl = new URL('../src/modules/visitRequests/visit.validation.js', import.meta.url).href
const boqSchemaUrl = new URL('../src/modules/boqRequests/boq.validation.js', import.meta.url).href
const contactSchemaUrl = new URL('../src/modules/contactMessages/contact.validation.js', import.meta.url).href
const uploadValidationUrl = new URL('../src/utils/uploadValidation.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

mock.module(quoteSchemaUrl, {
    exports: {
        createQuoteRequestSchema: withSchemaEvent(createQuoteRequestSchema, 'QUOTE'),
    },
})
mock.module(visitSchemaUrl, {
    exports: {
        createVisitRequestSchema: withSchemaEvent(createVisitRequestSchema, 'VISIT'),
    },
})
mock.module(boqSchemaUrl, {
    exports: {
        createBOQRequestSchema: withSchemaEvent(createBOQRequestSchema, 'BOQ'),
    },
})
mock.module(contactSchemaUrl, {
    exports: {
        createContactSchema: withSchemaEvent(createContactSchema, 'CONTACT'),
    },
})
mock.module(uploadValidationUrl, {
    exports: {
        UploadValidationError: class UploadValidationError extends Error {},
        validateUploadedFile: async () => {
            state.events.push('file')
            if (state.fileError) throw state.fileError
        },
    },
})
mock.module(emailValidationUrl, {
    exports: {
        normalizeEmail: normalizeEmailValue,
        validateCustomerEmail: async (email) => {
            state.events.push(`email:${email}`)
            if (state.emailResult) return state.emailResult
            if (state.useTransientDns) return transientDnsValidator.validateCustomerEmail(email)
            return { isValid: true, normalizedEmail: normalizeEmailValue(email) }
        },
    },
})
mock.module(quoteServiceUrl, {
    exports: {
        createQuoteRequest: async (data) => recordServiceCall('quote', data),
        getQuoteRequestsByEmail: async (email) => {
            state.events.push(`lookup:quote:${email}`)
            return []
        },
    },
})
mock.module(visitServiceUrl, {
    exports: {
        createVisitRequest: async (data) => recordServiceCall('visit', data),
        getVisitRequestsByEmail: async (email) => {
            state.events.push(`lookup:visit:${email}`)
            return []
        },
    },
})
mock.module(boqServiceUrl, {
    exports: {
        createBOQRequest: async (data) => recordServiceCall('boq', data),
        getBOQsByEmail: async (email) => {
            state.events.push(`lookup:boq:${email}`)
            return []
        },
    },
})
mock.module(contactServiceUrl, {
    exports: {
        createContact: async (data) => recordServiceCall('contact', data),
        getMessages: async () => [],
    },
})

const [
    { createQuote, getQuotesByEmail },
    { createVisit, getVisitsByEmail },
    { createBOQ, getBOQsByEmail },
    { createContact },
] = await Promise.all([
    import('../src/modules/quoteRequests/quote.controller.js'),
    import('../src/modules/visitRequests/visit.controller.js'),
    import('../src/modules/boqRequests/boq.controller.js'),
    import('../src/modules/contactMessages/contact.controller.js'),
])

const email = '  Alice@Example.invalid  '
const file = { originalname: 'request.pdf', mimetype: 'application/pdf', buffer: Buffer.from('file') }
const bodies = {
    quote: {
        first_name: 'Alice',
        last_name: 'Customer',
        phone: '+201287879794',
        email,
        custom_product_name: 'Custom product',
        details: 'Please provide a quotation.',
    },
    visit: {
        factory_name: 'Example Factory',
        factory_activity: 'Manufacturing',
        name: 'Alice Customer',
        phone_number: '+201287879794',
        whatsapp_number: '+201287879794',
        email,
        address: 'Example Street',
        preferred_date: '2030-01-02T03:04:05.000Z',
        details: 'Please arrange a site visit.',
    },
    boq: {
        name: 'Alice Customer',
        company_name: 'Example Company',
        email,
        phone: '+201287879794',
        project_name: 'Example Project',
        project_location: 'Example Location',
        project_type: 'commercial',
    },
    contact: {
        first_name: 'Alice',
        last_name: 'Customer',
        email,
        phone_number: '+201287879794',
        whatsapp_number: '+201287879794',
        message: 'Please contact me about a project.',
    },
}

const createCases = [
    {
        name: 'quote',
        controller: createQuote,
        schema: createQuoteRequestSchema,
        request: () => ({ body: bodies.quote, file }),
        expectedEvents: ['schema:QUOTE', 'file', `email:Alice@Example.invalid`, 'service:quote'],
    },
    {
        name: 'visit',
        controller: createVisit,
        schema: createVisitRequestSchema,
        request: () => ({ body: bodies.visit, file }),
        expectedEvents: ['schema:VISIT', 'file', `email:Alice@Example.invalid`, 'service:visit'],
    },
    {
        name: 'boq',
        controller: createBOQ,
        schema: createBOQRequestSchema,
        request: () => ({ body: bodies.boq, files: { boq_file: [file], supporting_docs: [] } }),
        expectedEvents: ['schema:BOQ', 'file', `email:Alice@Example.invalid`, 'service:boq'],
    },
    {
        name: 'contact',
        controller: createContact,
        schema: createContactSchema,
        request: () => ({ body: bodies.contact }),
        expectedEvents: ['schema:CONTACT', 'email:Alice@Example.invalid', 'service:contact'],
    },
]

const response = () => ({
    statusCode: null,
    body: null,
    status(statusCode) {
        this.statusCode = statusCode
        return this
    },
    json(body) {
        this.body = body
        return this
    },
})

const reset = () => {
    state.events = []
    state.serviceCalls = []
    state.emailResult = null
    state.fileError = null
    state.schemaFailure = null
    state.useTransientDns = false
    transientDnsValidator.resetForTests()
}

test('all four request controllers validate email after schema/file validation and pass normalized email to services', async () => {
    for (const testCase of createCases) {
        reset()
        const res = response()

        await testCase.controller(testCase.request(), res)

        assert.equal(res.statusCode, 201, testCase.name)
        assert.deepEqual(state.events, testCase.expectedEvents, testCase.name)
        assert.equal(state.serviceCalls[0].data.email, 'alice@example.invalid', testCase.name)
    }
})

test('honeypot submissions return matching fake success responses without downstream work', async () => {
    for (const testCase of createCases) {
        reset()
        const realResponse = response()
        await testCase.controller(testCase.request(), realResponse)

        reset()
        const logLines = []
        const originalInfo = console.info
        console.info = (...values) => logLines.push(values)
        const fakeRequest = testCase.request()
        fakeRequest.body = {
            ...fakeRequest.body,
            sdc_ref: 'bot-filled-value',
            email: 'must-not-be-echoed@example.invalid',
            message: 'must not be echoed',
        }
        const fakeResponse = response()
        try {
            await testCase.controller(fakeRequest, fakeResponse)
        } finally {
            console.info = originalInfo
        }

        assert.equal(fakeResponse.statusCode, 201, testCase.name)
        assert.equal(fakeResponse.statusCode, realResponse.statusCode, testCase.name)
        assert.deepEqual(
            Object.keys(fakeResponse.body).sort(),
            Object.keys(realResponse.body).sort(),
            testCase.name
        )
        assert.equal(fakeResponse.body.message, PUBLIC_REQUEST_SUCCESS_MESSAGES[testCase.name.toUpperCase()])
        assert.equal(fakeResponse.body.message, realResponse.body.message, testCase.name)
        assert.deepEqual(Object.keys(fakeResponse.body.data), ['id'], testCase.name)
        assert.match(fakeResponse.body.data.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        assert.equal(JSON.stringify(fakeResponse.body).includes('must-not-be-echoed'), false, testCase.name)
        assert.equal(JSON.stringify(fakeResponse.body).includes('must not be echoed'), false, testCase.name)
        assert.equal(state.events.length, 0, testCase.name)
        assert.equal(state.serviceCalls.length, 0, testCase.name)
        assert.deepEqual(logLines, [[testCase.name.toUpperCase()]], testCase.name)
        if (testCase.name !== 'contact') {
            assert.equal(fakeRequest.file, undefined, testCase.name)
            assert.equal(fakeRequest.files, undefined, testCase.name)
        }
    }
})

test('empty or whitespace-only honeypot values continue through normal request handling', async () => {
    for (const testCase of createCases) {
        for (const sdcRef of [undefined, '', ' \t ']) {
            reset()
            const request = testCase.request()
            if (sdcRef !== undefined) request.body.sdc_ref = sdcRef
            const res = response()

            await testCase.controller(request, res)

            assert.equal(res.statusCode, 201, `${testCase.name}:${JSON.stringify(sdcRef)}`)
            assert.deepEqual(state.events, testCase.expectedEvents, testCase.name)
            assert.equal(state.serviceCalls.length, 1, testCase.name)
        }
    }
})

test('email validation errors preserve endpoint status and response shape without calling services', async () => {
    const invalidResults = [
        [
            'INVALID_EMAIL_DOMAIN',
            'The email domain does not appear to exist or cannot receive emails. Please check your email address.',
        ],
        [
            'DISPOSABLE_EMAIL_NOT_ALLOWED',
            'Disposable or temporary email addresses are not allowed. Please use a permanent email address.',
        ],
    ]

    for (const testCase of createCases) {
        for (const [code, error] of invalidResults) {
            reset()
            state.emailResult = { isValid: false, code, error }
            const res = response()
            const request = testCase.request()
            await testCase.controller(request, res)

            assert.equal(res.statusCode, 400, `${testCase.name}:${code}`)
            assert.deepEqual(
                res.body,
                testCase.name === 'contact'
                    ? { message: error, code }
                    : { success: false, message: error, code },
                `${testCase.name}:${code}`
            )
            assert.equal(state.serviceCalls.length, 0, `${testCase.name}:${code}`)
            assert.equal(
                state.events.at(-1),
                'email:Alice@Example.invalid',
                `${testCase.name}:${code}`
            )
        }
    }
})

test('malformed email addresses fail with the existing schema response before downstream work', async () => {
    for (const testCase of createCases) {
        const invalidEmails = ['not-an-email', 'alice\r\n@example.invalid']

        for (const invalidEmail of invalidEmails) {
            reset()
            const request = testCase.request()
            request.body = { ...request.body, email: invalidEmail }
            const schemaResult = testCase.schema.safeParse(request.body)
            assert.equal(schemaResult.success, false, `${testCase.name}:${JSON.stringify(invalidEmail)}`)
            const res = response()

            await testCase.controller(request, res)

            assert.equal(res.statusCode, 400, `${testCase.name}:${JSON.stringify(invalidEmail)}`)
            assert.equal(Object.hasOwn(res.body, 'code'), false, `${testCase.name}:${JSON.stringify(invalidEmail)}`)
            assert.deepEqual(
                Object.keys(res.body).sort(),
                testCase.name === 'contact' ? ['message'] : ['message', 'success'],
                `${testCase.name}:${JSON.stringify(invalidEmail)}`
            )

            const expectedMessage = testCase.name === 'contact'
                ? schemaResult.error.errors?.[0]?.message || 'Validation error'
                : schemaResult.error.issues.map((issue) => issue.message).filter(Boolean).join(' ')
            assert.equal(res.body.message, expectedMessage, `${testCase.name}:${JSON.stringify(invalidEmail)}`)
            assert.deepEqual(
                state.events,
                [`schema:${testCase.name.toUpperCase()}`],
                `${testCase.name}:${JSON.stringify(invalidEmail)}`
            )
            assert.equal(state.serviceCalls.length, 0, `${testCase.name}:${JSON.stringify(invalidEmail)}`)
        }
    }
})

test('schema or uploaded-file validation failure prevents email validation and service calls', async () => {
    for (const testCase of createCases) {
        reset()
        state.schemaFailure = testCase.name.toUpperCase()
        const invalidRequest = testCase.name === 'boq'
            ? { body: {}, files: { boq_file: [file], supporting_docs: [] } }
            : { body: {}, ...(testCase.name === 'contact' ? {} : { file }) }
        const schemaResponse = response()

        await testCase.controller(invalidRequest, schemaResponse)

        assert.equal(state.events.some((event) => event.startsWith('email:')), false, `${testCase.name}:schema`)
        assert.equal(state.serviceCalls.length, 0, `${testCase.name}:schema`)

        if (testCase.name !== 'contact') {
            reset()
            state.fileError = Object.assign(new Error('Invalid file type or content.'), { code: 'INVALID_UPLOAD' })
            const fileResponse = response()

            await testCase.controller(testCase.request(), fileResponse)

            assert.deepEqual(
                state.events.filter((event) => event === 'file' || event.startsWith('email:')),
                ['file'],
                `${testCase.name}:file`
            )
            assert.equal(state.serviceCalls.length, 0, `${testCase.name}:file`)
        }
    }
})

test('transient DNS failure fails open and allows a request through', async () => {
    reset()
    state.useTransientDns = true
    const res = response()

    await createQuote(createCases[0].request(), res)

    assert.equal(res.statusCode, 201)
    assert.equal(state.serviceCalls.length, 1)
    assert.equal(state.serviceCalls[0].data.email, 'alice@example.invalid')
})

test('staff email lookup controllers normalize path parameters before service queries', async () => {
    reset()
    await getQuotesByEmail({ params: { email } }, response())
    await getVisitsByEmail({ params: { email } }, response())
    await getBOQsByEmail({ params: { email } }, response())

    assert.deepEqual(state.events, [
        'lookup:quote:alice@example.invalid',
        'lookup:visit:alice@example.invalid',
        'lookup:boq:alice@example.invalid',
    ])
})
