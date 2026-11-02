import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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
    API_PUBLIC_URL: 'http://api.example.invalid/api',
    NODE_ENV: 'test',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const [
    { default: cloudinary },
    { default: prisma },
    { default: env },
    accessService,
    { createCompanyEmailAttachmentLinks },
    { createNotificationRecoveryService },
    { default: emailAccessRoutes },
] = await Promise.all([
    import('../src/config/storage.js'),
    import('../src/utils/prisma.js'),
    import('../src/config/env.js'),
    import('../src/modules/attachments/emailAttachmentAccess.service.js'),
    import('../src/modules/attachments/emailAttachmentAccess.service.js'),
    import('../src/modules/notifications/notificationRecovery.service.js'),
    import('../src/modules/attachments/emailAttachmentAccess.routes.js'),
])

const replaceMethod = (t, target, methodName, implementation) => {
    const original = target[methodName]
    target[methodName] = implementation
    t.after(() => {
        target[methodName] = original
    })
}

const fakeAttachment = () => ({
    id: 'a0f1f3b2-3f21-4b6a-9bcb-314a112ac01e',
    original_filename: 'request.pdf',
    public_id: 'requests/quote/request',
    mime_type: 'application/pdf',
    file_size: 2048,
    resource_type: 'raw',
    delivery_type: 'authenticated',
    status: 'ACTIVE',
    quote_request_id: 'a0f1f3b2-3f21-4b6a-9bcb-314a112ac02e',
    visit_request_id: null,
    boq_request_id: null,
})

test('company email link generation stores only per-attachment hashes for seven days', async () => {
    const createdRows = []
    const links = await createCompanyEmailAttachmentLinks({
        requestType: 'boq',
        request: {
            attachments: [
                {
                    id: 'attachment-main',
                    original_filename: 'main.xlsx',
                    public_id: 'boq/documents/main',
                },
                {
                    id: 'attachment-support-a',
                    original_filename: 'support-a.pdf',
                    public_id: 'boq/supporting/support-a',
                },
                {
                    id: 'attachment-support-b',
                    original_filename: 'support-b.pdf',
                    public_id: 'boq/supporting/support-b',
                },
            ],
        },
        attempt: { id: 'notification-attempt-1' },
        transactionClient: {
            emailAttachmentAccessToken: {
                async createMany({ data }) {
                    createdRows.push(...data)
                    return { count: data.length }
                },
            },
        },
        now: new Date('2026-03-01T10:00:00.000Z'),
    })

    test('company links fail clearly without a configured public API base', async () => {
        const configuredApiUrl = env.apiPublicUrl
        env.apiPublicUrl = ''
        let tokenRowsCreated = false

        try {
            await assert.rejects(
                createCompanyEmailAttachmentLinks({
                    requestType: 'visit',
                    request: {
                        attachments: [{
                            id: 'attachment-id',
                            original_filename: 'request.pdf',
                            public_id: 'requests/visit/request',
                        }],
                    },
                    attempt: { id: 'attempt-id' },
                    transactionClient: {
                        emailAttachmentAccessToken: {
                            async createMany() {
                                tokenRowsCreated = true
                            },
                        },
                    },
                    now: new Date('2026-03-01T10:00:00.000Z'),
                }),
                { code: 'API_PUBLIC_URL_NOT_CONFIGURED' }
            )
            assert.equal(tokenRowsCreated, false)
        } finally {
            env.apiPublicUrl = configuredApiUrl
        }
    })

    assert.equal(links.length, 3)
    assert.deepEqual(links.map(({ label }) => label), [
        'BOQ Main Document',
        'Supporting Document 1',
        'Supporting Document 2',
    ])
    assert.equal(new Set(links.map(({ url }) => url.split('/').pop())).size, 3)
    assert.ok(links.every(({ url }) =>
        url.startsWith('http://api.example.invalid/api/attachments/email/')
    ))
    assert.equal(createdRows.length, 3)
    assert.ok(createdRows.every((row) =>
        row.notification_attempt_id === 'notification-attempt-1' &&
        row.issued_at.toISOString() === '2026-03-01T10:00:00.000Z' &&
        row.expires_at.toISOString() === '2026-03-08T10:00:00.000Z' &&
        /^[a-f0-9]{64}$/.test(row.token_hash) &&
        !Object.hasOwn(row, 'token')
    ))

    const rawTokens = links.map(({ url }) => url.split('/').pop())
    assert.deepEqual(
        createdRows.map(({ token_hash }) => token_hash).sort(),
        rawTokens.map((token) =>
            createHash('sha256').update(token, 'utf8').digest('hex')
        ).sort()
    )
})

test('company link validation allows sent, unknown, and in-flight attempts and signs for five minutes', async (t) => {
    const token = 'V'.repeat(43)
    const hash = createHash('sha256').update(token, 'utf8').digest('hex')
    const attachment = fakeAttachment()
    let status = 'SENT'
    replaceMethod(t, prisma.emailAttachmentAccessToken, 'findUnique', async () => ({
        token_hash: hash,
        expires_at: new Date('2026-03-08T10:00:00.000Z'),
        revoked_at: null,
        notification_attempt: {
            status,
            request_type: 'QUOTE',
            request_id: attachment.quote_request_id,
        },
        attachment,
    }))
    const signedCalls = []
    replaceMethod(t, cloudinary.utils, 'private_download_url', (...args) => {
        signedCalls.push(args)
        return 'https://cloudinary.example/short-lived'
    })
    const now = new Date('2026-03-01T10:00:00.000Z')

    for (const attemptStatus of ['SENDING', 'SENT', 'UNKNOWN']) {
        status = attemptStatus
        assert.equal(
            await accessService.createEmailAttachmentDownloadUrl(token, now),
            'https://cloudinary.example/short-lived'
        )
    }

    assert.equal(signedCalls.length, 3)
    for (const [publicId, format, options] of signedCalls) {
        assert.equal(publicId, attachment.public_id)
        assert.equal(format, 'pdf')
        assert.equal(options.resource_type, 'raw')
        assert.equal(options.type, 'authenticated')
        assert.equal(options.expires_at, Math.floor(now.getTime() / 1000) + 300)
        assert.equal(options.attachment, true)
    }
})

test('invalid, expired, revoked, failed, and mismatched company links are uniformly rejected', async (t) => {
    const token = 'Q'.repeat(43)
    const hash = createHash('sha256').update(token, 'utf8').digest('hex')
    let row = {
        token_hash: hash,
        expires_at: new Date('2026-03-08T10:00:00.000Z'),
        revoked_at: null,
        notification_attempt: {
            status: 'SENT',
            request_type: 'QUOTE',
            request_id: fakeAttachment().quote_request_id,
        },
        attachment: fakeAttachment(),
    }
    replaceMethod(t, prisma.emailAttachmentAccessToken, 'findUnique', async () => row)
    let signed = false
    replaceMethod(t, cloudinary.utils, 'private_download_url', () => {
        signed = true
        return 'https://cloudinary.example/should-not-be-signed'
    })
    const now = new Date('2026-03-01T10:00:00.000Z')

    assert.equal(await accessService.createEmailAttachmentDownloadUrl('malformed', now), null)
    assert.equal(await accessService.createEmailAttachmentDownloadUrl('R'.repeat(43), now), null)

    for (const mutate of [
        (value) => ({ ...value, expires_at: new Date('2026-03-01T10:00:00.000Z') }),
        (value) => ({ ...value, revoked_at: new Date('2026-03-01T09:00:00.000Z') }),
        (value) => ({
            ...value,
            notification_attempt: { ...value.notification_attempt, status: 'FAILED' },
        }),
        (value) => ({
            ...value,
            notification_attempt: { ...value.notification_attempt, request_id: 'different-request' },
        }),
        (value) => ({
            ...value,
            attachment: { ...value.attachment, status: 'DELETED' },
        }),
    ]) {
        row = mutate(row)
        assert.equal(await accessService.createEmailAttachmentDownloadUrl(token, now), null)
        row = {
            ...row,
            expires_at: new Date('2026-03-08T10:00:00.000Z'),
            revoked_at: null,
            notification_attempt: {
                status: 'SENT',
                request_type: 'QUOTE',
                request_id: fakeAttachment().quote_request_id,
            },
            attachment: fakeAttachment(),
        }
    }

    assert.equal(signed, false)
})

test('notification retries preserve unknown-attempt tokens and revoke only certain failures', async () => {
    const requestId = 'request-1'
    const attachmentId = 'attachment-1'
    let record = {
        id: requestId,
        email: 'company@example.invalid',
        notification_status: 'pending',
        notification_attempts: 0,
        notification_error_code: null,
        notification_error_message: null,
        notification_last_attempt_at: null,
        notification_lease_expires_at: null,
        notification_lease_token: null,
        notification_sent_at: null,
        attachments: [{
            id: attachmentId,
            original_filename: 'request.pdf',
            public_id: 'requests/visit/request',
        }],
    }
    let currentTime = new Date('2026-03-01T10:00:00.000Z')
    let leaseCounter = 0
    const attempts = new Map()
    const tokens = []
    const sends = []
    const requestDelegate = {
        async updateMany({ where, data }) {
            if (where.notification_lease_token !== undefined) {
                if (record.notification_lease_token !== where.notification_lease_token) {
                    return { count: 0 }
                }
                Object.assign(record, data)
                return { count: 1 }
            }
            const [leaseState, statusState] = where.AND
            const leaseAvailable = leaseState.OR.some((condition) =>
                condition.notification_lease_expires_at === null
                    ? record.notification_lease_expires_at === null
                    : record.notification_lease_expires_at &&
                      record.notification_lease_expires_at <= condition.notification_lease_expires_at.lte
            )
            const statusAllowed = statusState.OR.some((condition) =>
                typeof condition.notification_status === 'string'
                    ? record.notification_status === condition.notification_status
                    : condition.notification_status.in.includes(record.notification_status)
            )
            if (!leaseAvailable || !statusAllowed) return { count: 0 }
            record.notification_status = data.notification_status
            record.notification_attempts += data.notification_attempts.increment
            record.notification_last_attempt_at = data.notification_last_attempt_at
            record.notification_lease_expires_at = data.notification_lease_expires_at
            record.notification_lease_token = data.notification_lease_token
            record.notification_error_code = data.notification_error_code
            record.notification_error_message = data.notification_error_message
            return { count: 1 }
        },
        async findUnique({ where }) {
            return record.id === where.id ? { ...record } : null
        },
    }
    const transactionClient = {
        visitRequest: requestDelegate,
        notificationAttempt: {
            async create({ data }) {
                const attempt = {
                    id: `attempt-${data.request_id}-${data.attempt_number}`,
                    ...data,
                }
                attempts.set(attempt.id, attempt)
                return attempt
            },
            async update({ where, data }) {
                Object.assign(attempts.get(where.id), data)
                return attempts.get(where.id)
            },
        },
        emailAttachmentAccessToken: {
            async createMany({ data }) {
                tokens.push(...data.map((row) => ({ ...row, revoked_at: null })))
                return { count: data.length }
            },
            async updateMany({ where, data }) {
                let count = 0
                for (const row of tokens) {
                    if (
                        row.notification_attempt_id === where.notification_attempt_id &&
                        row.revoked_at === where.revoked_at
                    ) {
                        Object.assign(row, data)
                        count += 1
                    }
                }
                return { count }
            },
        },
    }
    let sendCount = 0
    const service = createNotificationRecoveryService({
        delegates: { visitRequest: requestDelegate },
        transaction: (callback) => callback(transactionClient),
        prepareEmail: createCompanyEmailAttachmentLinks,
        createToken: () => `lease-${++leaseCounter}`,
        now: () => new Date(currentTime),
        leaseMs: 60_000,
        cooldownMs: 5 * 60_000,
        senders: {
            visit: async (_request, links) => {
                sends.push(links)
                sendCount += 1
                if (sendCount === 1) {
                    throw Object.assign(new Error('smtp timeout'), { code: 'EMAIL_TIMEOUT' })
                }
            },
        },
        logger: { info() {}, error() {} },
    })

    const first = await service.attemptInitial('visit', requestId)
    assert.equal(first.status, 'unknown')
    assert.equal(attempts.get('attempt-request-1-1').status, 'UNKNOWN')
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0].revoked_at, null)
    assert.equal(sends[0].length, 1)

    currentTime = new Date(currentTime.getTime() + 5 * 60_000)
    const retried = await service.retry('visit', requestId, {
        confirmUnknownDelivery: true,
    })
    assert.equal(retried.status, 'sent')
    assert.equal(attempts.get('attempt-request-1-2').status, 'SENT')
    assert.equal(tokens.length, 2)
    assert.ok(tokens.every((row) => row.revoked_at === null))
    assert.notEqual(sends[0][0].url, sends[1][0].url)

    record = {
        id: 'request-2',
        email: 'company@example.invalid',
        notification_status: 'pending',
        notification_attempts: 0,
        notification_error_code: null,
        notification_error_message: null,
        notification_last_attempt_at: null,
        notification_lease_expires_at: null,
        notification_lease_token: null,
        notification_sent_at: null,
        attachments: [{
            id: 'attachment-2',
            original_filename: 'failed-request.pdf',
            public_id: 'requests/visit/failed-request',
        }],
    }

    const failedService = createNotificationRecoveryService({
        delegates: { visitRequest: requestDelegate },
        transaction: (callback) => callback(transactionClient),
        prepareEmail: createCompanyEmailAttachmentLinks,
        createToken: () => `lease-${++leaseCounter}`,
        now: () => new Date(currentTime),
        leaseMs: 60_000,
        senders: {
            visit: async () => {
                throw Object.assign(new Error('smtp rejected'), { code: 'EAUTH' })
            },
        },
        logger: { info() {}, error() {} },
    })
    const failed = await failedService.retry('visit', 'request-2')
    assert.equal(failed.status, 'failed')
    assert.equal(attempts.get('attempt-request-2-1').status, 'FAILED')
    assert.ok(tokens[2].revoked_at instanceof Date)
    assert.equal(tokens[0].revoked_at, null)
    assert.equal(tokens[1].revoked_at, null)
})

test('company email access route redirects valid links without requiring authentication', async (t) => {
    const token = 'B'.repeat(43)
    const hash = createHash('sha256').update(token, 'utf8').digest('hex')
    const attachment = fakeAttachment()
    replaceMethod(t, prisma.emailAttachmentAccessToken, 'findUnique', async () => ({
        token_hash: hash,
        expires_at: new Date(Date.now() + 60_000),
        revoked_at: null,
        notification_attempt: {
            status: 'SENT',
            request_type: 'QUOTE',
            request_id: attachment.quote_request_id,
        },
        attachment,
    }))
    replaceMethod(t, cloudinary.utils, 'private_download_url', () =>
        'https://cloudinary.example/temporary-signed-download'
    )
    const app = express()
    app.use('/api/attachments', emailAccessRoutes)
    const server = app.listen(0, '127.0.0.1')
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    await new Promise((resolve) => server.once('listening', resolve))

    const { port } = server.address()
    const response = await fetch(
        `http://127.0.0.1:${port}/api/attachments/email/${token}`,
        { redirect: 'manual' }
    )
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), 'https://cloudinary.example/temporary-signed-download')
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
})
