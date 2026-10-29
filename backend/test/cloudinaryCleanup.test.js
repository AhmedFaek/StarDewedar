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

for (const [key, value] of Object.entries(testEnv)) {
    process.env[key] = value
}

const [{ default: cloudinary }, {
    cleanupCloudinaryAssets,
    persistWithCloudinaryCleanup,
    settleCloudinaryUploads,
    validateCloudinaryUploadResult,
}] = await Promise.all([
    import('../src/config/storage.js'),
    import('../src/utils/cloudinaryCleanup.js'),
])

test('cleanup distinguishes deleted, already-missing, and failed Cloudinary responses', async (t) => {
    const calls = []
    const logs = []
    t.mock.method(cloudinary.uploader, 'destroy', async (publicId, options) => {
        calls.push({ publicId, options })
        if (publicId === 'visit/doc') return { result: 'ok' }
        if (publicId === 'quote/image') return { result: 'not found' }
        return { result: 'error', error: { code: 'UNAVAILABLE', name: 'CloudinaryError' } }
    })
    t.mock.method(console, 'error', (...args) => logs.push(args))

    const outcomes = await cleanupCloudinaryAssets([
        { public_id: 'visit/doc', resource_type: 'raw' },
        { public_id: 'quote/image', resource_type: 'image' },
        { public_id: 'boq/file', resource_type: 'raw' },
    ], 'VISIT')

    assert.deepEqual(calls, [
        { publicId: 'visit/doc', options: { resource_type: 'raw' } },
        { publicId: 'quote/image', options: { resource_type: 'image' } },
        { publicId: 'boq/file', options: { resource_type: 'raw' } },
    ])
    assert.deepEqual(outcomes.map(({ status }) => status), [
        'deleted',
        'already_missing',
        'failed',
    ])
    const cleanupLog = logs.find(([, details]) => details?.requestType === 'VISIT')
    assert.deepEqual(cleanupLog, [
        'Cloudinary asset cleanup failed',
        {
            event: 'cloudinary_asset_cleanup_failed',
            requestType: 'VISIT',
            publicId: 'boq/file',
            resourceType: 'raw',
            errorCode: 'UNAVAILABLE',
            errorName: 'CloudinaryError',
        },
    ])
})

test('cleanup safely ignores empty or invalid asset lists', async (t) => {
    let deleteCalls = 0
    const logs = []
    t.mock.method(cloudinary.uploader, 'destroy', async () => {
        deleteCalls += 1
        return { result: 'ok' }
    })
    t.mock.method(console, 'error', (...args) => logs.push(args))

    assert.deepEqual(await cleanupCloudinaryAssets(null, 'VISIT'), [])
    assert.deepEqual(await cleanupCloudinaryAssets({}, 'QUOTE'), [])
    assert.deepEqual(await cleanupCloudinaryAssets([
        null,
        { public_id: 'missing-resource-type' },
        { resource_type: 'raw' },
    ], 'BOQ'), [])
    assert.equal(deleteCalls, 0)
    assert.equal(
        logs.filter(([, details]) => details?.requestType === 'BOQ').length,
        3
    )
})

test('upload result validation requires public ID, resource type, and secure URL', () => {
    const uploadResult = {
        public_id: 'request/file',
        resource_type: 'raw',
        secure_url: 'https://res.cloudinary.com/test/raw/upload/request/file',
    }

    assert.equal(validateCloudinaryUploadResult(uploadResult), uploadResult)
    for (const invalidResult of [
        null,
        { ...uploadResult, public_id: '' },
        { ...uploadResult, resource_type: undefined },
        { ...uploadResult, secure_url: '' },
    ]) {
        assert.throws(
            () => validateCloudinaryUploadResult(invalidResult),
            { code: 'CLOUDINARY_INVALID_UPLOAD_RESPONSE' }
        )
    }
})

test('Visit and Quote persistence failures clean their uploaded asset and preserve the DB error', async (t) => {
    const deleted = []
    t.mock.method(cloudinary.uploader, 'destroy', async (publicId, options) => {
        deleted.push({ publicId, options })
        return { result: 'ok' }
    })

    const databaseError = new Error('database insert failed')
    const asset = { public_id: 'request/attachment', resource_type: 'raw' }

    for (const requestType of ['VISIT', 'QUOTE']) {
        await assert.rejects(
            persistWithCloudinaryCleanup([asset], requestType, async () => {
                throw databaseError
            }),
            (error) => error === databaseError
        )
    }

    assert.equal(deleted.length, 2)
    assert.ok(deleted.every(({ publicId, options }) =>
        publicId === asset.public_id && options.resource_type === asset.resource_type
    ))
})

test('cleanup failure is logged without replacing the persistence error', async (t) => {
    const logs = []
    const databaseError = new Error('database insert failed')
    const cleanupError = Object.assign(new Error('Cloudinary unavailable'), {
        code: 'CLOUDINARY_ERROR',
    })

    t.mock.method(cloudinary.uploader, 'destroy', async () => {
        throw cleanupError
    })
    t.mock.method(console, 'error', (...args) => logs.push(args))

    await assert.rejects(
        persistWithCloudinaryCleanup(
            [{ public_id: 'boq/main', resource_type: 'raw' }],
            'BOQ',
            async () => { throw databaseError }
        ),
        (error) => error === databaseError
    )

    const cleanupLog = logs.find(([, details]) => details?.requestType === 'BOQ')
    assert.deepEqual(cleanupLog, [
        'Cloudinary asset cleanup failed',
        {
            event: 'cloudinary_asset_cleanup_failed',
            requestType: 'BOQ',
            publicId: 'boq/main',
            resourceType: 'raw',
            errorCode: 'CLOUDINARY_ERROR',
            errorName: 'Error',
        },
    ])
})

test('cleanup and logging failures do not replace the persistence error', async (t) => {
    const databaseError = new Error('database insert failed')
    t.mock.method(cloudinary.uploader, 'destroy', async () => {
        throw new Error('Cloudinary unavailable')
    })
    t.mock.method(console, 'error', () => {
        throw new Error('logger unavailable')
    })

    await assert.rejects(
        persistWithCloudinaryCleanup(
            [{ public_id: 'quote/file', resource_type: 'raw' }],
            'QUOTE',
            async () => { throw databaseError }
        ),
        (error) => error === databaseError
    )
})

test('successful persistence does not delete uploaded assets', async (t) => {
    let deleteCalls = 0
    t.mock.method(cloudinary.uploader, 'destroy', async () => {
        deleteCalls += 1
        return { result: 'ok' }
    })

    const persistedRequest = { id: 'request-1' }
    const result = await persistWithCloudinaryCleanup(
        [{ public_id: 'boq/main', resource_type: 'raw' }],
        'BOQ',
        async () => persistedRequest
    )

    assert.equal(result, persistedRequest)
    assert.equal(deleteCalls, 0)
})

test('BOQ waits for every supporting upload before cleaning confirmed assets', async (t) => {
    const events = []
    t.mock.method(cloudinary.uploader, 'destroy', async (publicId) => {
        events.push(`delete:${publicId}`)
        return { result: 'ok' }
    })

    let resolveLateUpload
    const lateUpload = new Promise((resolve) => {
        resolveLateUpload = resolve
    })
    const uploadError = new Error('supporting upload failed')

    const result = settleCloudinaryUploads([
        Promise.resolve({
            public_id: 'boq/support-a',
            resource_type: 'raw',
            secure_url: 'https://res.cloudinary.com/test/raw/upload/support-a',
        }),
        Promise.reject(uploadError),
        lateUpload,
    ], [{ public_id: 'boq/main', resource_type: 'raw' }], 'BOQ')

    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual(events, [])

    resolveLateUpload({
        public_id: 'boq/support-c',
        resource_type: 'raw',
        secure_url: 'https://res.cloudinary.com/test/raw/upload/support-c',
    })
    await assert.rejects(result, (error) => error === uploadError)

    assert.deepEqual(new Set(events), new Set([
        'delete:boq/main',
        'delete:boq/support-a',
        'delete:boq/support-c',
    ]))
})

test('BOQ cleans confirmed uploads when a fulfilled result lacks deletion metadata', async (t) => {
    const deleted = []
    t.mock.method(cloudinary.uploader, 'destroy', async (publicId, options) => {
        deleted.push({ publicId, options })
        return { result: 'ok' }
    })

    await assert.rejects(
        settleCloudinaryUploads([
            Promise.resolve({
                public_id: 'boq/support',
                resource_type: 'raw',
                secure_url: 'https://res.cloudinary.com/test/raw/upload/support',
            }),
            Promise.resolve({ secure_url: 'https://res.cloudinary.com/test/upload/unknown' }),
        ], [{ public_id: 'boq/main', resource_type: 'raw' }], 'BOQ'),
        { code: 'CLOUDINARY_INVALID_UPLOAD_RESPONSE' }
    )

    assert.deepEqual(new Set(deleted.map(({ publicId }) => publicId)), new Set([
        'boq/main',
        'boq/support',
    ]))
})

test('BOQ persistence failure cleans main and all supporting assets', async (t) => {
    const deleted = []
    t.mock.method(cloudinary.uploader, 'destroy', async (publicId, options) => {
        deleted.push({ publicId, options })
        return { result: 'ok' }
    })

    const { assets } = await settleCloudinaryUploads([
        Promise.resolve({
            public_id: 'boq/support-a',
            resource_type: 'raw',
            secure_url: 'https://res.cloudinary.com/test/raw/upload/support-a',
        }),
        Promise.resolve({
            public_id: 'boq/support-b',
            resource_type: 'raw',
            secure_url: 'https://res.cloudinary.com/test/raw/upload/support-b',
        }),
    ], [{ public_id: 'boq/main', resource_type: 'raw' }], 'BOQ')

    const databaseError = new Error('BOQ insert failed')
    await assert.rejects(
        persistWithCloudinaryCleanup(assets, 'BOQ', async () => {
            throw databaseError
        }),
        (error) => error === databaseError
    )

    assert.equal(deleted.length, 3)
})
