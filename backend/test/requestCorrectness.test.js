import assert from 'node:assert/strict'
import { test } from 'node:test'

const testEnv = {
    PORT: '0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
}

Object.assign(process.env, testEnv)

const [
    { default: cloudinary },
    { default: prisma },
    { transporter },
    { createVisit },
    { createQuote },
    { createBOQ },
    visitService,
    quoteService,
] = await Promise.all([
    import('../src/config/storage.js'),
    import('../src/utils/prisma.js'),
    import('../src/utils/mailer.js'),
    import('../src/modules/visitRequests/visit.controller.js'),
    import('../src/modules/quoteRequests/quote.controller.js'),
    import('../src/modules/boqRequests/boq.controller.js'),
    import('../src/modules/visitRequests/visit.service.js'),
    import('../src/modules/quoteRequests/quote.service.js'),
])

const attachment = {
    originalname: 'request.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\n%%EOF'),
}

const requestBodies = {
    VISIT: {
        factory_name: 'Example Factory',
        factory_activity: 'Manufacturing',
        name: 'Example Customer',
        phone_number: '+12345678901',
        whatsapp_number: '+12345678901',
        email: 'customer@example.invalid',
        address: 'Example Street',
        preferred_date: '2030-01-02T03:04:05.000Z',
        details: 'Please arrange a site visit.',
    },
    QUOTE: {
        first_name: 'Example',
        last_name: 'Customer',
        phone: '+12345678901',
        email: 'customer@example.invalid',
        custom_product_name: 'Custom Product Request',
        details: 'Please provide a quotation.',
    },
    BOQ: {
        name: 'Example Customer',
        company_name: 'Example Company',
        email: 'customer@example.invalid',
        phone: '+12345678901',
        project_name: 'Example Project',
        project_location: 'Example Location',
        project_type: 'commercial',
    },
}

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

const replaceMethod = (t, target, methodName, implementation) => {
    const original = target[methodName]
    target[methodName] = implementation
    t.after(() => {
        target[methodName] = original
    })
}

const replaceQuoteTransaction = (t, { product = null, create, onFindUnique = () => {} }) => {
    replaceMethod(t, prisma, '$transaction', (callback) => callback({
        product: {
            findUnique: async (args) => {
                onFindUnique(args)
                return product
            },
        },
        quoteRequest: {
            create,
        },
    }))
}

const invokeCreate = (requestType, body = requestBodies[requestType], file = null) => {
    const req = { body }
    if (requestType === 'BOQ') {
        req.files = file
            ? { boq_file: [file], supporting_docs: [] }
            : { boq_file: [attachment], supporting_docs: [] }
    } else if (file) {
        req.file = file
    }

    const res = response()
    const controller = {
        VISIT: createVisit,
        QUOTE: createQuote,
        BOQ: createBOQ,
    }[requestType]

    return controller(req, res).then(() => res)
}

const prismaDelegates = {
    VISIT: prisma.visitRequest,
    QUOTE: prisma.quoteRequest,
    BOQ: prisma.bOQRequest,
}

test('public create schemas reject client-owned attachment URLs', async (t) => {
    let uploadCalls = 0
    const logs = []
    t.mock.method(cloudinary.uploader, 'upload_stream', () => {
        uploadCalls += 1
        throw new Error('Cloudinary should not receive rejected attachment URLs')
    })
    t.mock.method(console, 'error', (...args) => logs.push(args))

    for (const [requestType, reservedFields] of [
        ['VISIT', ['file_url']],
        ['QUOTE', ['file_url', 'custom_image_url']],
    ]) {
        for (const field of reservedFields) {
            const body = {
                ...requestBodies[requestType],
                [field]: 'https://attacker.example.invalid/private-document',
            }
            const result = await invokeCreate(requestType, body)

            assert.equal(result.statusCode, 400)
            assert.equal(result.body.success, false)
            assert.equal(result.body.message.includes('attacker.example.invalid'), false)
        }
    }

    assert.equal(uploadCalls, 0)
    assert.equal(JSON.stringify(logs).includes('customer@example.invalid'), false)
    assert.ok(logs.some(([, details]) =>
        details?.event === 'public_request_creation_failed' &&
        details.requestType === 'QUOTE' &&
        details.errorName === 'ZodError'
    ))
})

test('Visit and Quote services whitelist create data even when called with untrusted URL fields', async (t) => {
    const captured = {}
    replaceMethod(t, prisma.visitRequest, 'create', async ({ data }) => {
        captured.visit = data
        return { id: 'visit-1', ...data }
    })
    replaceQuoteTransaction(t, { create: async ({ data }) => {
        captured.quote = data
        return { id: 'quote-1', product: null, ...data }
    } })
    t.mock.method(transporter, 'sendMail', async () => ({ messageId: 'test-message' }))

    await visitService.createVisitRequest({
        ...requestBodies.VISIT,
        file_url: 'https://attacker.example.invalid/visit.pdf',
        untrusted_field: 'not persisted',
    }, null)
    await quoteService.createQuoteRequest({
        ...requestBodies.QUOTE,
        file_url: 'https://attacker.example.invalid/quote.pdf',
        custom_image_url: 'https://attacker.example.invalid/product.png',
        untrusted_field: 'not persisted',
    }, null)

    assert.equal(Object.hasOwn(captured.visit, 'file_url'), false)
    assert.equal(Object.hasOwn(captured.quote, 'file_url'), false)
    assert.equal(Object.hasOwn(captured.quote, 'custom_image_url'), false)
    assert.equal(Object.hasOwn(captured.visit, 'untrusted_field'), false)
    assert.equal(Object.hasOwn(captured.quote, 'untrusted_field'), false)
    assert.equal(captured.visit.name, requestBodies.VISIT.name)
    assert.equal(captured.quote.custom_product_name, requestBodies.QUOTE.custom_product_name)
    assert.equal(captured.quote.product_name_en_snapshot, null)
    assert.equal(captured.quote.product_name_ar_snapshot, null)
})

test('catalog Quote snapshots come from the database Product lookup', async (t) => {
    const captured = {}
    const product = {
        name_en: 'Database English Name',
        name_ar: 'اسم قاعدة البيانات',
    }
    let lookup
    replaceQuoteTransaction(t, {
        product,
        onFindUnique: (args) => { lookup = args },
        create: async ({ data }) => {
            captured.data = data
            return { id: 'quote-catalog-1', product, ...data }
        },
    })
    t.mock.method(transporter, 'sendMail', async () => ({ messageId: 'test-message' }))

    await quoteService.createQuoteRequest({
        ...requestBodies.QUOTE,
        product_id: 'catalog-product-1',
        product_name_en_snapshot: 'Untrusted English Name',
        product_name_ar_snapshot: 'اسم غير موثوق',
    }, null)

    assert.deepEqual(lookup, {
        where: { id: 'catalog-product-1' },
        select: { name_en: true, name_ar: true },
    })
    assert.equal(captured.data.product_id, 'catalog-product-1')
    assert.equal(captured.data.product_name_en_snapshot, product.name_en)
    assert.equal(captured.data.product_name_ar_snapshot, product.name_ar)
})

test('custom Quote requests do not look up or persist catalog snapshots', async (t) => {
    const captured = {}
    let lookupCount = 0
    replaceQuoteTransaction(t, {
        onFindUnique: () => { lookupCount += 1 },
        create: async ({ data }) => {
            captured.data = data
            return { id: 'quote-custom-1', product: null, ...data }
        },
    })
    t.mock.method(transporter, 'sendMail', async () => ({ messageId: 'test-message' }))

    await quoteService.createQuoteRequest(requestBodies.QUOTE, null)

    assert.equal(lookupCount, 0)
    assert.equal(captured.data.product_id, null)
    assert.equal(captured.data.custom_product_name, requestBodies.QUOTE.custom_product_name)
    assert.equal(captured.data.product_name_en_snapshot, null)
    assert.equal(captured.data.product_name_ar_snapshot, null)
})

test('catalog Quote creation fails if the selected Product no longer exists', async (t) => {
    let createCount = 0
    replaceQuoteTransaction(t, {
        create: async () => {
            createCount += 1
            return { id: 'unexpected-quote' }
        },
    })

    await assert.rejects(
        quoteService.createQuoteRequest({
            ...requestBodies.QUOTE,
            product_id: 'deleted-product',
        }, null),
        /Requested product is no longer available/
    )
    assert.equal(createCount, 0)
})

test('Visit and Quote persist only the Cloudinary URL after a successful multipart upload', async (t) => {
    const captured = {}
    let uploadCount = 0
    replaceMethod(t, prisma.visitRequest, 'create', async ({ data }) => {
        captured.visit = data
        return { id: 'visit-upload-1', ...data }
    })
    replaceQuoteTransaction(t, { create: async ({ data }) => {
        captured.quote = data
        return { id: 'quote-upload-1', product: null, ...data }
    } })
    t.mock.method(cloudinary.uploader, 'upload_stream', (_options, callback) => ({
        end() {
            uploadCount += 1
            callback(null, {
                public_id: `request/${uploadCount}`,
                resource_type: 'raw',
                secure_url: `https://res.cloudinary.com/test/raw/upload/request/${uploadCount}.pdf`,
            })
        },
    }))
    t.mock.method(transporter, 'sendMail', async () => ({ messageId: 'test-message' }))

    await visitService.createVisitRequest({
        ...requestBodies.VISIT,
        file_url: 'https://attacker.example.invalid/visit.pdf',
    }, attachment)
    await quoteService.createQuoteRequest({
        ...requestBodies.QUOTE,
        file_url: 'https://attacker.example.invalid/quote.pdf',
        custom_image_url: 'https://attacker.example.invalid/product.png',
    }, attachment)

    assert.equal(uploadCount, 2)
    assert.equal(captured.visit.file_url, 'https://res.cloudinary.com/test/raw/upload/request/1.pdf')
    assert.equal(captured.quote.file_url, 'https://res.cloudinary.com/test/raw/upload/request/2.pdf')
    assert.equal(Object.hasOwn(captured.quote, 'custom_image_url'), false)
})

test('successful public create requests retain their 201 response shape', async (t) => {
    const persistedData = {}
    for (const requestType of ['VISIT', 'QUOTE', 'BOQ']) {
        const delegate = prismaDelegates[requestType]
        const create = async ({ data }) => {
            persistedData[requestType] = data
            return {
                id: `${requestType.toLowerCase()}-1`,
                ...data,
                ...(requestType === 'QUOTE' ? { product: null } : {}),
            }
        }
        if (requestType === 'QUOTE') {
            replaceQuoteTransaction(t, { create })
        } else {
            replaceMethod(t, delegate, 'create', create)
        }
    }
    t.mock.method(cloudinary.uploader, 'upload_stream', (_options, callback) => ({
        end() {
            callback(null, {
                public_id: 'boq/request',
                resource_type: 'raw',
                secure_url: 'https://res.cloudinary.com/test/raw/upload/boq/request.pdf',
            })
        },
    }))
    t.mock.method(transporter, 'sendMail', async () => ({ messageId: 'test-message' }))

    for (const requestType of ['VISIT', 'QUOTE', 'BOQ']) {
        const result = await invokeCreate(requestType, requestBodies[requestType], attachment)
        assert.equal(result.statusCode, 201)
        assert.deepEqual(Object.keys(result.body).sort(), ['data', 'message', 'success'])
        assert.equal(result.body.success, true)
        assert.equal(typeof result.body.message, 'string')
        assert.ok(result.body.data.id)
        const persistedAttachment = requestType === 'BOQ'
            ? result.body.data.boq_file_url
            : result.body.data.file_url
        assert.equal(persistedAttachment, 'https://res.cloudinary.com/test/raw/upload/boq/request.pdf')
    }

    assert.deepEqual(Object.keys(persistedData), ['VISIT', 'QUOTE', 'BOQ'])
})

test('notification email failures remain non-fatal after persistence', async (t) => {
    const persistedTypes = []
    for (const requestType of ['VISIT', 'QUOTE', 'BOQ']) {
        const create = async ({ data }) => {
            persistedTypes.push(requestType)
            return {
                id: `${requestType.toLowerCase()}-email-failure`,
                ...data,
                ...(requestType === 'QUOTE' ? { product: null } : {}),
            }
        }
        if (requestType === 'QUOTE') {
            replaceQuoteTransaction(t, { create })
        } else {
            replaceMethod(t, prismaDelegates[requestType], 'create', create)
        }
    }
    t.mock.method(cloudinary.uploader, 'upload_stream', (_options, callback) => ({
        end() {
            callback(null, {
                public_id: 'request/notification',
                resource_type: 'raw',
                secure_url: 'https://res.cloudinary.com/test/raw/upload/request/notification.pdf',
            })
        },
    }))
    t.mock.method(transporter, 'sendMail', async () => {
        throw Object.assign(new Error('SMTP detail'), { code: 'SMTP_UNAVAILABLE' })
    })
    const logs = []
    t.mock.method(console, 'error', (...args) => logs.push(args))

    for (const requestType of ['VISIT', 'QUOTE', 'BOQ']) {
        const result = await invokeCreate(requestType, requestBodies[requestType], attachment)
        assert.equal(result.statusCode, 201)
        assert.equal(result.body.success, true)
    }

    assert.deepEqual(persistedTypes, ['VISIT', 'QUOTE', 'BOQ'])
    assert.equal(JSON.stringify(logs).includes('customer@example.invalid'), false)
    assert.ok(['VISIT', 'QUOTE', 'BOQ'].every((requestType) =>
        logs.some(([, details]) =>
            details?.event === 'request_notification_email_failed' &&
            details.requestType === requestType &&
            details.requestId === `${requestType.toLowerCase()}-email-failure`
        )
    ))
})

test('known upload validation failures retain a safe client error response', async (t) => {
    t.mock.method(console, 'error', () => {})

    const result = await invokeCreate('BOQ', requestBodies.BOQ, {
        ...attachment,
        buffer: Buffer.from('not a PDF'),
    })

    assert.equal(result.statusCode, 400)
    assert.equal(result.body.message, 'Invalid file type or content.')
})

for (const requestType of ['VISIT', 'QUOTE', 'BOQ']) {
    test(`${requestType} Cloudinary failures return a generic 500 response`, async (t) => {
        const logs = []
        const providerError = Object.assign(
            new Error('provider detail and secret must not be public'),
            { code: 'CLOUDINARY_UNAVAILABLE' }
        )
        t.mock.method(cloudinary.uploader, 'upload_stream', (_options, callback) => ({
            end() {
                callback(providerError)
            },
        }))
        t.mock.method(console, 'error', (...args) => logs.push(args))

        const result = await invokeCreate(requestType, requestBodies[requestType], attachment)

        assert.equal(result.statusCode, 500)
        assert.equal(result.body.message, 'Failed to create request. Please try again later.')
        assert.equal(JSON.stringify(result.body).includes('provider detail'), false)
        assert.equal(JSON.stringify(logs).includes('customer@example.invalid'), false)
        assert.ok(logs.some(([, details]) =>
            details?.requestType === requestType &&
            details.errorCode === 'CLOUDINARY_UNAVAILABLE'
        ))
    })

    test(`${requestType} database failures return a generic 500 response`, async (t) => {
        const logs = []
        const databaseError = Object.assign(
            new Error('database secret and query details'),
            { code: 'P2002', name: 'PrismaClientKnownRequestError' }
        )
        const create = async () => {
            throw databaseError
        }
        if (requestType === 'QUOTE') {
            replaceQuoteTransaction(t, { create })
        } else {
            replaceMethod(t, prismaDelegates[requestType], 'create', create)
        }
        t.mock.method(cloudinary.uploader, 'upload_stream', (_options, callback) => ({
            end() {
                callback(null, {
                    public_id: 'boq/request',
                    resource_type: 'raw',
                    secure_url: 'https://res.cloudinary.com/test/raw/upload/boq/request.pdf',
                })
            },
        }))
        t.mock.method(cloudinary.uploader, 'destroy', async () => ({ result: 'ok' }))
        t.mock.method(console, 'error', (...args) => logs.push(args))

        const result = await invokeCreate(
            requestType,
            requestBodies[requestType],
            requestType === 'BOQ' ? attachment : null
        )

        assert.equal(result.statusCode, 500)
        assert.equal(result.body.message, 'Failed to create request. Please try again later.')
        assert.equal(JSON.stringify(result.body).includes('database secret'), false)
        assert.equal(JSON.stringify(logs).includes('customer@example.invalid'), false)
        assert.ok(logs.some(([, details]) =>
            details?.requestType === requestType &&
            details.errorCode === 'P2002' &&
            details.errorName === 'PrismaClientKnownRequestError'
        ))
    })
}

test('unexpected uncoded service errors return a generic 500 response', async (t) => {
    const unexpectedError = new Error('internal detail must not be public')
    t.mock.method(console, 'error', () => {})
    replaceMethod(t, prisma.visitRequest, 'create', async () => {
        throw unexpectedError
    })

    const result = await invokeCreate('VISIT')

    assert.equal(result.statusCode, 500)
    assert.equal(result.body.message, 'Failed to create request. Please try again later.')
    assert.equal(JSON.stringify(result.body).includes('internal detail'), false)
})
