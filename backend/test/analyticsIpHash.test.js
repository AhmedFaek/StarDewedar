import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import express from 'express'
import { mock, test } from 'node:test'

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
    CLIENT_IP_SOURCE: 'x-real-ip',
    VERIFICATION_CODE_PEPPER: 'analytics-test-pepper-with-at-least-32-chars',
    NODE_ENV: 'test',
})

const repositoryState = { upsertCalls: [] }
const repositoryUrl = new URL(
    '../src/modules/analytics/analytics.repository.js',
    import.meta.url
).href

mock.module(repositoryUrl, {
    exports: {
        upsertSession: async (...args) => {
            repositoryState.upsertCalls.push(args)
            return { sessionId: args[0], isNew: true }
        },
    },
})

const [{ hashIp }, { default: analyticsRoutes }, { getClientIp }] = await Promise.all([
    import('../src/modules/analytics/analytics.service.js'),
    import('../src/modules/analytics/analytics.routes.js'),
    import('../src/utils/clientIp.js'),
])

test('analytics IP hashes are deterministic, domain-separated, and keyed', () => {
    const ip = '203.0.113.42'
    const pepper = 'first-test-pepper-with-at-least-32-chars'
    const hash = hashIp(ip, pepper)

    assert.equal(hashIp(ip, pepper), hash)
    assert.notEqual(hashIp('203.0.113.43', pepper), hash)
    assert.notEqual(crypto.createHash('sha256').update(ip).digest('hex'), hash)
    assert.notEqual(
        hashIp(ip, 'second-test-pepper-with-at-least-32-chars'),
        hash
    )
    assert.match(hash, /^[a-f0-9]{64}$/u)
})

test('heartbeat stores only session fields and a keyed IP digest, never the raw IP', async (t) => {
    repositoryState.upsertCalls.length = 0
    const clientIp = '198.51.100.27'
    const sessionId = 'c4d2e119-6b0d-4ed1-8c2f-613aa690ed27'
    const app = express()
    app.use(express.json())
    app.use('/api/analytics', analyticsRoutes)

    const logCalls = []
    for (const method of ['log', 'info', 'warn', 'error']) {
        t.mock.method(console, method, (...args) => logCalls.push(args))
    }

    const server = app.listen(0, '127.0.0.1')
    t.after(() => new Promise((resolve, reject) => {
        server.closeAllConnections()
        server.close((error) => error ? reject(error) : resolve())
    }))
    await new Promise((resolve) => server.once('listening', resolve))

    const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api/analytics/heartbeat`,
        {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-real-ip': clientIp,
            },
            body: JSON.stringify({ sessionId }),
        }
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { sessionId })
    assert.equal(getClientIp({ headers: { 'x-real-ip': clientIp } }), clientIp)
    assert.equal(repositoryState.upsertCalls.length, 1)

    const [storedSessionId, storedIpHash] = repositoryState.upsertCalls[0]
    assert.equal(storedSessionId, sessionId)
    assert.equal(storedIpHash, hashIp(clientIp))
    assert.equal(storedIpHash.length, 64)
    assert.equal(JSON.stringify(repositoryState.upsertCalls).includes(clientIp), false)
    assert.equal(JSON.stringify(logCalls).includes(clientIp), false)
})
