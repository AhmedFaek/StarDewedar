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
    { REQUEST_STATUSES, REQUEST_STATUS_DESCRIPTIONS, QUOTE_COMPLETED_DESCRIPTION },
    { createRequestWorkflowService },
    quoteRepository,
    visitRepository,
    boqRepository,
    { updateQuoteRequestSchema },
    { updateVisitRequestSchema },
    { updateBOQRequestSchema },
    { toAdminRequest, toPublicRequest },
    { default: prisma },
    { setUserLookup },
    { default: requestWorkflowRoutes },
    { default: quoteRoutes },
    { default: env },
] = await Promise.all([
    import('../src/utils/requestStatus.js'),
    import('../src/modules/requestWorkflow/requestWorkflow.service.js'),
    import('../src/modules/quoteRequests/quote.repository.js'),
    import('../src/modules/visitRequests/visit.repository.js'),
    import('../src/modules/boqRequests/boq.repository.js'),
    import('../src/modules/quoteRequests/quote.validation.js'),
    import('../src/modules/visitRequests/visit.validation.js'),
    import('../src/modules/boqRequests/boq.validation.js'),
    import('../src/utils/publicRequestDto.js'),
    import('../src/utils/prisma.js'),
    import('../src/middleware/auth.middleware.js'),
    import('../src/modules/requestWorkflow/requestWorkflow.routes.js'),
    import('../src/modules/quoteRequests/quote.routes.js'),
    import('../src/config/env.js'),
])

const replaceMethod = (t, target, methodName, implementation) => {
    const original = target[methodName]
    target[methodName] = implementation
    t.after(() => {
        target[methodName] = original
    })
}

test('all request types share the six statuses and reject archive as a status', () => {
    const schemas = [
        updateQuoteRequestSchema,
        updateVisitRequestSchema,
        updateBOQRequestSchema,
    ]

    assert.deepEqual(REQUEST_STATUSES, [
        'pending',
        'contacted',
        'in_progress',
        'completed',
        'rejected',
        'closed',
    ])
    for (const schema of schemas) {
        for (const status of REQUEST_STATUSES) {
            assert.equal(schema.safeParse({ status }).success, true)
        }
        assert.equal(schema.safeParse({ status: 'archived' }).success, false)
    }

})

test('administrator status catalog includes every description and the Quote completion rule', () => {
    const workflow = createRequestWorkflowService({ database: {} })
    const catalog = workflow.getStatusCatalog()

    assert.deepEqual(catalog.statuses, REQUEST_STATUS_DESCRIPTIONS)
    assert.equal(
        catalog.request_specific_notes.quote_completed,
        QUOTE_COMPLETED_DESCRIPTION
    )
    assert.equal(catalog.statuses.some(({ value }) => value === 'archived'), false)
})

test('archive and restore are independent, idempotent, and preserve status and attachments', async () => {
    const fixedDate = new Date('2026-11-04T10:00:00.000Z')
    const records = {
        quoteRequest: {
            id: 'quote-id',
            status: 'completed',
            archived_at: null,
            attachments: [{ id: 'quote-attachment' }],
        },
        visitRequest: {
            id: 'visit-id',
            status: 'in_progress',
            archived_at: null,
            attachments: [{ id: 'visit-attachment' }],
        },
        bOQRequest: {
            id: 'boq-id',
            status: 'rejected',
            archived_at: null,
            attachments: [{ id: 'boq-attachment' }],
        },
    }
    const database = Object.fromEntries(
        Object.entries(records).map(([delegateName, record]) => [
            delegateName,
            {
                async findUnique({ where }) {
                    if (where.id !== record.id) return null
                    return {
                        id: record.id,
                        status: record.status,
                        archived_at: record.archived_at,
                    }
                },
                async updateMany({ where, data }) {
                    if (where.id !== record.id) return { count: 0 }
                    const isCurrentlyArchived = Boolean(record.archived_at)
                    if (
                        where.archived_at === null && isCurrentlyArchived ||
                        where.archived_at?.not === null && !isCurrentlyArchived
                    ) {
                        return { count: 0 }
                    }
                    record.archived_at = data.archived_at
                    return { count: 1 }
                },
            },
        ])
    )
    const workflow = createRequestWorkflowService({
        database,
        now: () => fixedDate,
    })

    for (const [requestType, record] of Object.entries(records)) {
        const type = requestType === 'quoteRequest'
            ? 'quote'
            : requestType === 'visitRequest' ? 'visit' : 'boq'
        const archived = await workflow.setArchived(type, record.id, true)
        assert.equal(archived.status, record.status)
        assert.equal(archived.archived_at, fixedDate)

        const repeatedArchive = await workflow.setArchived(type, record.id, true)
        assert.equal(repeatedArchive.archived_at, fixedDate)

        const restored = await workflow.setArchived(type, record.id, false)
        assert.equal(restored.status, record.status)
        assert.equal(restored.archived_at, null)
        assert.equal(record.attachments.length, 1)
        assert.equal(record.attachments[0].id.endsWith('attachment'), true)
    }

    assert.equal(await workflow.setArchived('quote', 'missing-id', true), null)
})

test('customer DTOs hide archive state while admin DTOs expose it', () => {
    const request = {
        id: 'request-id',
        status: 'closed',
        archived_at: new Date('2026-11-04T10:00:00.000Z'),
        attachments: [],
    }

    assert.equal(Object.hasOwn(toPublicRequest(request), 'archived_at'), false)
    assert.equal(toAdminRequest(request).archived_at, request.archived_at)
})

test('admin list filters distinguish active and archived requests without hiding customer history', async (t) => {
    const calls = []
    for (const [delegateName, method] of [
        ['quoteRequest', quoteRepository.findAll],
        ['visitRequest', visitRepository.findAll],
        ['bOQRequest', boqRepository.findAll],
    ]) {
        replaceMethod(t, prisma[delegateName], 'findMany', async (query) => {
            calls.push({ delegateName, query })
            return []
        })
        await method({ archived: false })
        await method({ archived: true })
    }

    assert.deepEqual(
        calls.map(({ query }) => query.where.archived_at),
        [null, { not: null }, null, { not: null }, null, { not: null }]
    )

    const quoteCalls = []
    replaceMethod(t, prisma.quoteRequest, 'findMany', async (query) => {
        quoteCalls.push(query)
        return []
    })
    await quoteRepository.findByEmail('customer@example.invalid')
    await quoteRepository.findByEmail('admin@example.invalid', false)
    assert.deepEqual(quoteCalls[0].where, { email: 'customer@example.invalid' })
    assert.deepEqual(quoteCalls[1].where, {
        email: 'admin@example.invalid',
        archived_at: null,
    })
})

test('workflow endpoints enforce request-management access and preserve status during archive/restore', async (t) => {
    const requestId = 'a0f1f3b2-3f21-4b6a-9bcb-314a112ac01e'
    const record = { id: requestId, status: 'completed', archived_at: null }
    replaceMethod(t, prisma.quoteRequest, 'findUnique', async ({ where }) =>
        where.id === requestId ? { ...record } : null
    )
    replaceMethod(t, prisma.quoteRequest, 'updateMany', async ({ where, data }) => {
        if (where.id !== requestId) return { count: 0 }
        const isArchived = Boolean(record.archived_at)
        if (
            where.archived_at === null && isArchived ||
            where.archived_at?.not === null && !isArchived
        ) {
            return { count: 0 }
        }
        record.archived_at = data.archived_at
        return { count: 1 }
    })
    setUserLookup(async (userId) => ({ id: userId, role: userId, name: 'Test Admin' }))
    t.after(() => setUserLookup())

    const app = express()
    app.use('/api/quotes', quoteRoutes)
    app.use('/api/request-workflow', requestWorkflowRoutes)
    const server = app.listen(0, '127.0.0.1')
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    await new Promise((resolve) => server.once('listening', resolve))

    const { port } = server.address()
    const send = async (path, role, method = 'GET') => fetch(
        `http://127.0.0.1:${port}${path}`,
        {
            method,
            headers: {
                authorization: `Bearer ${jwt.sign(
                    { userId: role },
                    env.jwtSecret,
                    { algorithm: 'HS256' }
                )}`,
            },
        }
    )

    const statusesResponse = await send('/api/request-workflow/statuses', 'sales_support_manager')
    assert.equal(statusesResponse.status, 200)
    assert.equal((await statusesResponse.json()).data.statuses.length, 6)
    assert.equal(
        (await send('/api/request-workflow/statuses', 'catalog_manager')).status,
        403
    )

    const archived = await send(`/api/quotes/${requestId}/archive`, 'sales_support_manager', 'POST')
    assert.equal(archived.status, 200)
    const archiveData = (await archived.json()).data
    assert.equal(archiveData.status, 'completed')
    assert.ok(archiveData.archived_at)

    const restored = await send(`/api/quotes/${requestId}/restore`, 'sales_support_manager', 'POST')
    assert.equal(restored.status, 200)
    const restoreData = (await restored.json()).data
    assert.equal(restoreData.status, 'completed')
    assert.equal(restoreData.archived_at, null)

    assert.equal(
        (await send(`/api/quotes/${requestId}/archive`, 'catalog_manager', 'POST')).status,
        403
    )
    assert.equal(record.archived_at, null)
    assert.equal(
        (await send('/api/quotes?archived=maybe', 'sales_support_manager')).status,
        400
    )
    assert.equal(
        (await send('/api/quotes/status/archived', 'sales_support_manager')).status,
        400
    )
})
