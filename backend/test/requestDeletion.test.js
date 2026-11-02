import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'

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
    NODE_ENV: 'test',
})

const [
    { createRequestDeletionService },
    { requireRole },
    { ROLES },
    { setUserLookup },
    { default: attachmentRoutes },
    { default: prisma },
    { default: env },
] = await Promise.all([
    import('../src/modules/attachments/requestDeletion.service.js'),
    import('../src/middleware/roles.middleware.js'),
    import('../src/utils/constants.js'),
    import('../src/middleware/auth.middleware.js'),
    import('../src/modules/attachments/attachment.routes.js'),
    import('../src/utils/prisma.js'),
    import('../src/config/env.js'),
])

const makeAttachment = (id = 'attachment-1', overrides = {}) => ({
    id,
    quote_request_id: 'request-1',
    visit_request_id: null,
    boq_request_id: null,
    original_filename: `${id}.pdf`,
    mime_type: 'application/pdf',
    file_size: 100,
    public_id: `requests/quote/${id}`,
    resource_type: 'raw',
    delivery_type: 'authenticated',
    status: 'ACTIVE',
    ...overrides,
})

const makeDatabase = ({
    attachments = [makeAttachment()],
    sharedReference = false,
    legacyReferences = {},
} = {}) => {
    const state = {
        request: { id: 'request-1', attachments },
        attachments: new Map(attachments.map((item) => [item.id, { ...item }])),
        operations: new Map(),
        tokens: attachments.map((item) => ({ attachment_id: item.id, revoked_at: null })),
        sharedReference,
        transactionCount: 0,
    }

    const withAttachment = (operation) => ({
        ...operation,
        attachment: operation.attachment_id
            ? state.attachments.get(operation.attachment_id) || null
            : null,
    })

    const cleanupOperation = {
        async findUnique({ where }) {
            const operation = where.id
                ? state.operations.get(where.id)
                : [...state.operations.values()].find((item) =>
                    item.public_id === where.public_id_resource_type_delivery_type.public_id &&
                    item.resource_type === where.public_id_resource_type_delivery_type.resource_type &&
                    item.delivery_type === where.public_id_resource_type_delivery_type.delivery_type
                )
            return operation ? withAttachment(operation) : null
        },
        async upsert({ where, create }) {
            const existing = await this.findUnique({ where })
            if (existing) return existing
            const operation = {
                id: `cleanup-${state.operations.size + 1}`,
                status: 'PENDING',
                attempt_count: 0,
                last_error: null,
                processing_token: null,
                completed_at: null,
                created_at: new Date('2026-11-03T10:00:00.000Z'),
                updated_at: new Date('2026-11-03T10:00:00.000Z'),
                ...create,
            }
            state.operations.set(operation.id, operation)
            return withAttachment(operation)
        },
        async updateMany({ where, data }) {
            const operation = state.operations.get(where.id)
            if (!operation) return { count: 0 }

            const allowedStatus = where.OR?.some((condition) => {
                if (condition.status?.in) return condition.status.in.includes(operation.status)
                if (condition.status === 'PROCESSING') {
                    return operation.status === 'PROCESSING' &&
                        operation.updated_at <= condition.updated_at.lte
                }
                return condition.status === operation.status
            })

            if (where.OR && !allowedStatus) return { count: 0 }
            if (where.status && operation.status !== where.status) return { count: 0 }
            if (where.processing_token && operation.processing_token !== where.processing_token) {
                return { count: 0 }
            }

            for (const [key, value] of Object.entries(data)) {
                operation[key] = value?.increment !== undefined
                    ? operation[key] + value.increment
                    : value
            }
            operation.updated_at = new Date('2026-11-03T10:00:01.000Z')
            return { count: 1 }
        },
        async findMany() {
            return [...state.operations.values()].map(withAttachment)
        },
    }

    const attachment = {
        async findFirst() {
            return state.sharedReference ? { id: 'other-attachment' } : null
        },
        async updateMany({ where, data }) {
            const record = state.attachments.get(where.id)
            if (!record) return { count: 0 }
            Object.assign(record, data)
            return { count: 1 }
        },
    }

    const requestDelegate = {
        async findUnique() {
            return state.request
        },
        async delete() {
            state.request = null
            return { id: 'request-1' }
        },
        async findMany() {
            return []
        },
    }

    const database = {
        attachment,
        cloudinaryCleanupOperation: cleanupOperation,
        emailAttachmentAccessToken: {
            async updateMany({ where, data }) {
                let count = 0
                for (const token of state.tokens) {
                    if (token.attachment_id === where.attachment_id && token.revoked_at === null) {
                        token.revoked_at = data.revoked_at
                        count += 1
                    }
                }
                return { count }
            },
        },
        quoteRequest: requestDelegate,
        visitRequest: requestDelegate,
        bOQRequest: requestDelegate,
        productImage: { findMany: async () => legacyReferences.productImage || [] },
        projectImage: { findMany: async () => legacyReferences.projectImage || [] },
        productCatalog: { findMany: async () => legacyReferences.productCatalog || [] },
        async $transaction(callback) {
            state.transactionCount += 1
            return callback(database)
        },
    }

    return { database, state }
}

const makeCloudinary = (destroy) => ({
    uploader: { destroy },
})

test('permanent request deletion requires the exact typed confirmation', async () => {
    const { database, state } = makeDatabase()
    const service = createRequestDeletionService({ database })

    await assert.rejects(
        service.deleteRequest('QUOTE', 'request-1', 'delete'),
        { code: 'DELETE_CONFIRMATION_REQUIRED', status: 400 }
    )
    assert.equal(state.transactionCount, 0)
    assert.ok(state.request)
})

test('deletion revokes email links, snapshots cleanup, and deletes with stored Cloudinary identity', async () => {
    const attachment = makeAttachment()
    const { database, state } = makeDatabase({ attachments: [attachment] })
    const calls = []
    const service = createRequestDeletionService({
        database,
        now: () => new Date('2026-11-03T10:00:00.000Z'),
        createClaimToken: () => 'cleanup-claim-token',
        cloudinaryClient: makeCloudinary(async (...args) => {
            calls.push(args)
            return { result: 'ok' }
        }),
        logger: { error() {} },
    })

    const result = await service.deleteRequest('QUOTE', 'request-1', 'DELETE')

    assert.equal(state.request, null)
    assert.ok(state.tokens[0].revoked_at)
    assert.equal(state.attachments.get(attachment.id).status, 'DELETED')
    assert.deepEqual(calls, [[
        attachment.public_id,
        {
            resource_type: 'raw',
            type: 'authenticated',
            invalidate: true,
        },
    ]])
    assert.equal(result.cleanup_operations[0].status, 'COMPLETED')
    assert.equal(result.cleanup_operations[0].request_type, 'QUOTE')
    assert.equal(result.cleanup_operations[0].request_id, 'request-1')
    assert.equal(result.cleanup_operations[0].attachment.original_filename, attachment.original_filename)
    assert.equal('public_id' in result.cleanup_operations[0], false)
    assert.equal('processing_token' in result.cleanup_operations[0], false)
})

test('unconfirmed deletion remains retryable and a confirmed not-found retry completes idempotently', async () => {
    const { database, state } = makeDatabase({
        attachments: [makeAttachment('boq-file', {
            quote_request_id: null,
            boq_request_id: 'request-1',
            public_id: 'requests/boq/boq-file',
        })],
    })
    let response = { result: 'error' }
    const service = createRequestDeletionService({
        database,
        createClaimToken: (() => {
            let count = 0
            return () => `claim-${++count}`
        })(),
        cloudinaryClient: makeCloudinary(async () => response),
        logger: { error() {} },
    })

    const deletion = await service.deleteRequest('BOQ', 'request-1', 'DELETE')
    const operationId = deletion.cleanup_operations[0].id
    assert.equal(deletion.cleanup_operations[0].status, 'FAILED')
    assert.equal(state.attachments.get('boq-file').status, 'CLEANUP_FAILED')
    assert.equal(state.operations.get(operationId).last_error, 'Cloudinary did not confirm asset deletion.')
    assert.equal(state.operations.get(operationId).attempt_count, 1)

    response = { result: 'not found' }
    const retried = await service.executeCleanupOperation(operationId, { conflictOnProcessing: true })
    assert.equal(retried.status, 'COMPLETED')
    assert.equal(retried.attempt_count, 2)
    assert.equal(state.attachments.get('boq-file').status, 'DELETED')

    const repeated = await service.executeCleanupOperation(operationId, { conflictOnProcessing: true })
    assert.equal(repeated.status, 'COMPLETED')
    assert.equal(repeated.attempt_count, 2)
})

test('a Cloudinary asset referenced elsewhere is not deleted and remains visible as a failure', async () => {
    const { database, state } = makeDatabase({ sharedReference: true })
    let destroyCalled = false
    const service = createRequestDeletionService({
        database,
        cloudinaryClient: makeCloudinary(async () => {
            destroyCalled = true
            return { result: 'ok' }
        }),
        logger: { error() {} },
    })

    const result = await service.deleteRequest('QUOTE', 'request-1', 'DELETE')

    assert.equal(destroyCalled, false)
    assert.equal(result.cleanup_operations[0].status, 'FAILED')
    assert.equal(result.cleanup_operations[0].last_error, 'Asset is still referenced by another active record.')
    assert.equal(state.attachments.get('attachment-1').status, 'CLEANUP_FAILED')
})

test('a Cloudinary URL still used by public media prevents asset deletion', async () => {
    const imageAttachment = makeAttachment('shared-image', {
        resource_type: 'image',
        public_id: 'requests/quote/shared-image',
    })
    const { database } = makeDatabase({
        attachments: [imageAttachment],
        legacyReferences: {
            productImage: [{
                image_url: 'https://res.cloudinary.com/example/image/authenticated/v123/requests/quote/shared-image.jpg',
            }],
        },
    })
    let destroyCalled = false
    const service = createRequestDeletionService({
        database,
        cloudinaryClient: makeCloudinary(async () => {
            destroyCalled = true
            return { result: 'ok' }
        }),
        logger: { error() {} },
    })

    const result = await service.deleteRequest('QUOTE', 'request-1', 'DELETE')

    assert.equal(destroyCalled, false)
    assert.equal(result.cleanup_operations[0].status, 'FAILED')
})

test('a stale cleanup owner cannot finalize an operation reclaimed by a newer attempt', async () => {
    const { database, state } = makeDatabase()
    let response = { result: 'ok' }
    let destroyCalls = 0
    const service = createRequestDeletionService({
        database,
        now: () => new Date('2026-11-03T10:00:00.000Z'),
        createClaimToken: (() => {
            let count = 0
            return () => `claim-${++count}`
        })(),
        cloudinaryClient: makeCloudinary(async () => {
            destroyCalls += 1
            if (destroyCalls === 1) {
                const operation = [...state.operations.values()][0]
                operation.processing_token = 'newer-claim'
            }
            return response
        }),
        logger: { error() {} },
    })

    const deleted = await service.deleteRequest('QUOTE', 'request-1', 'DELETE')
    const operationId = deleted.cleanup_operations[0].id
    assert.equal(deleted.cleanup_operations[0].status, 'PROCESSING')
    assert.equal(state.attachments.get('attachment-1').status, 'PENDING_DELETION')

    state.operations.get(operationId).updated_at = new Date('2020-01-01T00:00:00.000Z')
    response = { result: 'not found' }
    const reclaimed = await service.executeCleanupOperation(
        operationId,
        { conflictOnProcessing: true }
    )

    assert.equal(reclaimed.status, 'COMPLETED')
    assert.equal(reclaimed.attempt_count, 2)
    assert.equal(state.attachments.get('attachment-1').status, 'DELETED')
})

test('cleanup inspection returns only pending work by default and safe context fields', async () => {
    const { database } = makeDatabase()
    database.cloudinaryCleanupOperation.findMany = async () => [{
        id: 'cleanup-1',
        request_type: 'VISIT',
        request_id: 'request-1',
        status: 'FAILED',
        attempt_count: 3,
        last_error: 'Cloudinary deletion request failed.',
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: null,
        processing_token: 'must-not-leak',
        public_id: 'requests/visit/private-id',
        attachment: {
            original_filename: 'visit.pdf',
            mime_type: 'application/pdf',
            file_size: 100,
        },
    }]
    const service = createRequestDeletionService({ database })

    const operations = await service.listCleanupOperations()
    assert.equal(operations.length, 1)
    assert.equal(operations[0].status, 'FAILED')
    assert.equal(operations[0].attachment.original_filename, 'visit.pdf')
    assert.equal('public_id' in operations[0], false)
    assert.equal('processing_token' in operations[0], false)
})

test('only Super Admin passes the cleanup and permanent-deletion role guard', () => {
    const runGuard = (role) => {
        let nextCalled = false
        const response = {
            statusCode: null,
            status(code) {
                this.statusCode = code
                return this
            },
            json() {
                return this
            },
        }

        requireRole(ROLES.SUPER_ADMIN)(
            { user: role ? { role } : undefined },
            response,
            () => { nextCalled = true }
        )
        return { nextCalled, statusCode: response.statusCode }
    }

    assert.deepEqual(runGuard(ROLES.SUPER_ADMIN), { nextCalled: true, statusCode: null })
    assert.deepEqual(runGuard('sales_support_manager'), { nextCalled: false, statusCode: 403 })
    assert.deepEqual(runGuard('catalog_manager'), { nextCalled: false, statusCode: 403 })
    assert.deepEqual(runGuard(undefined), { nextCalled: false, statusCode: 401 })
})

test('cleanup inspection endpoint requires Super Admin and is mounted before attachment ID routes', async (t) => {
    const originalFindMany = prisma.cloudinaryCleanupOperation.findMany
    prisma.cloudinaryCleanupOperation.findMany = async () => []
    setUserLookup(async (userId) => ({ id: userId, role: userId, name: 'Test Admin' }))

    t.after(() => {
        prisma.cloudinaryCleanupOperation.findMany = originalFindMany
        setUserLookup()
    })

    const app = express()
    app.use('/api/attachments', attachmentRoutes)
    const server = app.listen(0, '127.0.0.1')
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    await new Promise((resolve) => server.once('listening', resolve))

    const { port } = server.address()
    const request = async (role) => fetch(
        `http://127.0.0.1:${port}/api/attachments/cleanup`,
        role
            ? { headers: { authorization: `Bearer ${jwt.sign({ userId: role }, env.jwtSecret)}` } }
            : {}
    )

    assert.equal((await request()).status, 401)
    assert.equal((await request('sales_support_manager')).status, 403)
    assert.equal((await request('catalog_manager')).status, 403)

    const superAdminResponse = await request(ROLES.SUPER_ADMIN)
    assert.equal(superAdminResponse.status, 200)
    assert.deepEqual((await superAdminResponse.json()).data, [])
})
