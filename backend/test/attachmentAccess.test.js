import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'

Object.assign(process.env, {
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
})

const [
    { default: cloudinary },
    { default: prisma },
    attachmentService,
    { toAdminRequest, toPublicRequest },
    { default: attachmentRoutes },
] = await Promise.all([
    import('../src/config/storage.js'),
    import('../src/utils/prisma.js'),
    import('../src/modules/attachments/attachment.service.js'),
    import('../src/utils/publicRequestDto.js'),
    import('../src/modules/attachments/attachment.routes.js'),
])

const attachment = (overrides = {}) => ({
    id: 'a0f1f3b2-3f21-4b6a-9bcb-314a112ac01e',
    quote_request_id: 'a0f1f3b2-3f21-4b6a-9bcb-314a112ac02e',
    visit_request_id: null,
    boq_request_id: null,
    original_filename: 'quote.pdf',
    mime_type: 'application/pdf',
    file_size: 2048,
    public_id: 'requests/quote/a0f1f3b2',
    resource_type: 'raw',
    delivery_type: 'authenticated',
    status: 'ACTIVE',
    created_at: new Date('2026-01-02T03:04:05.000Z'),
    quote_request: { user_id: 'customer-id' },
    visit_request: null,
    boq_request: null,
    ...overrides,
})

const replaceMethod = (t, target, methodName, implementation) => {
    const original = target[methodName]
    target[methodName] = implementation
    t.after(() => {
        target[methodName] = original
    })
}

test('admin roles with requests:manage can create short-lived signed downloads', async (t) => {
    replaceMethod(t, prisma.attachment, 'findUnique', async () => attachment())
    const calls = []
    replaceMethod(t, cloudinary.utils, 'private_download_url', (...args) => {
        calls.push({ args, timestamp: Math.floor(Date.now() / 1000) })
        return 'https://cloudinary.example/signed-download'
    })

    for (const role of ['super_admin', 'sales_support_manager']) {
        const url = await attachmentService.createAttachmentDownloadUrl(
            attachment().id,
            { userId: 'admin-id', role }
        )
        assert.equal(url, 'https://cloudinary.example/signed-download')
    }

    assert.equal(calls.length, 2)
    for (const { args: [publicId, format, options], timestamp } of calls) {
        assert.equal(publicId, 'requests/quote/a0f1f3b2')
        assert.equal(format, 'pdf')
        assert.equal(options.resource_type, 'raw')
        assert.equal(options.type, 'authenticated')
        assert.equal(options.attachment, true)
        assert.equal(options.expires_at, timestamp + 300)
    }
})

test('verified customers can access only active attachments owned by user_id', async (t) => {
    let record = attachment()
    replaceMethod(t, prisma.user, 'findUnique', async () => ({
        id: 'customer-id',
        email: 'customer@example.invalid',
        email_verified: true,
    }))
    replaceMethod(t, prisma.attachment, 'findUnique', async () => record)

    const metadata = await attachmentService.getAttachmentMetadata(
        attachment().id,
        { userId: 'customer-id', role: 'customer' }
    )

    assert.deepEqual(metadata, {
        id: attachment().id,
        original_filename: 'quote.pdf',
        mime_type: 'application/pdf',
        file_size: 2048,
        created_at: attachment().created_at,
        download_path: `/api/attachments/${attachment().id}/download`,
    })

    record = attachment({ status: 'DELETED' })
    assert.equal(await attachmentService.getAttachmentMetadata(
        attachment().id,
        { userId: 'customer-id', role: 'customer' }
    ), null)
})

test('unverified customers and users without request permission are denied', async (t) => {
    replaceMethod(t, prisma.user, 'findUnique', async () => ({
        id: 'customer-id',
        email: 'customer@example.invalid',
        email_verified: false,
    }))
    await assert.rejects(
        attachmentService.getAttachmentMetadata(
            attachment().id,
            { userId: 'customer-id', role: 'customer' }
        ),
        { code: 'ATTACHMENT_FORBIDDEN' }
    )

    for (const role of ['catalog_manager', 'unknown_role']) {
        await assert.rejects(
            attachmentService.getAttachmentMetadata(
                attachment().id,
                { userId: 'other-id', role }
            ),
            { code: 'ATTACHMENT_FORBIDDEN' }
        )
    }
})

test('verified customers cannot access another customer or legacy unowned attachments', async (t) => {
    replaceMethod(t, prisma.user, 'findUnique', async () => ({
        id: 'customer-id',
        email: 'other@example.invalid',
        email_verified: true,
    }))
    let record = attachment({ quote_request: { user_id: 'different-customer-id' } })
    replaceMethod(t, prisma.attachment, 'findUnique', async () => record)

    assert.equal(await attachmentService.getAttachmentMetadata(
        attachment().id,
        { userId: 'customer-id', role: 'customer' }
    ), null)

    record = attachment({ quote_request: { user_id: null } })
    assert.equal(await attachmentService.getAttachmentMetadata(
        attachment().id,
        { userId: 'customer-id', role: 'customer' }
    ), null)
})

test('signed URL generation rejects inconsistent Cloudinary metadata', async (t) => {
    replaceMethod(t, prisma.attachment, 'findUnique', async () =>
        attachment({ delivery_type: 'upload' })
    )
    let signed = false
    replaceMethod(t, cloudinary.utils, 'private_download_url', () => {
        signed = true
        return 'https://cloudinary.example/should-not-be-signed'
    })

    await assert.rejects(
        attachmentService.createAttachmentDownloadUrl(
            attachment().id,
            { userId: 'admin-id', role: 'super_admin' }
        ),
        { code: 'ATTACHMENT_STORAGE_METADATA_INVALID' }
    )
    assert.equal(signed, false)
})

test('signed downloads use the stored image/raw resource type and validated file format', async (t) => {
    const cases = [
        { mime_type: 'image/jpeg', resource_type: 'image', format: 'jpg' },
        { mime_type: 'image/png', resource_type: 'image', format: 'png' },
        { mime_type: 'application/pdf', resource_type: 'raw', format: 'pdf' },
        {
            mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            resource_type: 'raw',
            format: 'xlsx',
        },
    ]
    let record
    replaceMethod(t, prisma.attachment, 'findUnique', async () => record)
    const calls = []
    replaceMethod(t, cloudinary.utils, 'private_download_url', (...args) => {
        calls.push(args)
        return 'https://cloudinary.example/signed-download'
    })

    for (const testCase of cases) {
        record = attachment({
            mime_type: testCase.mime_type,
            resource_type: testCase.resource_type,
        })
        await attachmentService.createAttachmentDownloadUrl(
            record.id,
            { userId: 'admin-id', role: 'super_admin' }
        )
    }

    assert.deepEqual(calls.map(([, format, options]) => ({
        format,
        resource_type: options.resource_type,
        type: options.type,
    })), cases.map(({ format, resource_type }) => ({
        format,
        resource_type,
        type: 'authenticated',
    })))
})

test('attachment ID routes reject unauthenticated requests', async (t) => {
    const app = express()
    app.use('/api/attachments', attachmentRoutes)
    const server = app.listen(0, '127.0.0.1')
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    await new Promise((resolve) => server.once('listening', resolve))

    const { port } = server.address()
    const response = await fetch(
        `http://127.0.0.1:${port}/api/attachments/${attachment().id}`
    )
    assert.equal(response.status, 401)
})

test('request DTOs omit legacy Cloudinary URLs and expose safe attachment metadata only', () => {
    const request = {
        id: 'request-id',
        file_url: 'https://res.cloudinary.com/private',
        boq_file_url: 'https://res.cloudinary.com/private-boq',
        supporting_docs_urls: '["https://res.cloudinary.com/private-support"]',
        assets: { legacy_url: 'https://res.cloudinary.com/legacy' },
        user_id: 'customer-id',
        notification_lease_token: 'lease-secret',
        attachments: [{
            id: 'attachment-id',
            original_filename: 'quote.pdf',
            mime_type: 'application/pdf',
            file_size: 2048,
            created_at: new Date('2026-01-02T03:04:05.000Z'),
            public_id: 'private/public-id',
            resource_type: 'raw',
            delivery_type: 'authenticated',
            status: 'ACTIVE',
        }],
    }

    const publicRequest = toPublicRequest(request)
    const adminRequest = toAdminRequest(request)

    assert.equal(Object.hasOwn(publicRequest, 'user_id'), false)
    assert.equal(Object.hasOwn(adminRequest, 'user_id'), false)
    for (const dto of [publicRequest, adminRequest]) {
        assert.equal(Object.hasOwn(dto, 'file_url'), false)
        assert.equal(Object.hasOwn(dto, 'boq_file_url'), false)
        assert.equal(Object.hasOwn(dto, 'supporting_docs_urls'), false)
        assert.equal(Object.hasOwn(dto, 'assets'), false)
        assert.equal(JSON.stringify(dto).includes('res.cloudinary.com'), false)
        assert.equal(JSON.stringify(dto).includes('public_id'), false)
        assert.deepEqual(Object.keys(dto.attachments[0]).sort(), [
            'created_at',
            'download_path',
            'file_size',
            'id',
            'mime_type',
            'original_filename',
        ])
    }
})
