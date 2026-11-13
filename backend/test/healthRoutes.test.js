import assert from 'node:assert/strict'
import { request as httpRequest } from 'node:http'
import { test } from 'node:test'

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '5000',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:5173',
    SITE_URL: 'http://localhost:5173',
    CLIENT_IP_SOURCE: 'socket',
    CORS_ORIGINS: 'http://localhost:5173',
    VERIFICATION_CODE_PEPPER: '0123456789abcdef0123456789abcdef',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const [{ default: app }, { default: prisma }] = await Promise.all([
    import('../src/app.js'),
    import('../src/utils/prisma.js'),
])

const startServer = async (t) => {
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
    }))
    return server.address().port
}

const get = (port, path, headers = {}) => new Promise((resolve, reject) => {
    const req = httpRequest({
        host: '127.0.0.1',
        port,
        path,
        method: 'GET',
        headers,
    }, (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => { body += chunk })
        response.on('end', () => resolve({
            statusCode: response.statusCode,
            body: JSON.parse(body),
            headers: response.headers,
        }))
    })
    req.on('error', reject)
    req.end()
})

const replaceQuery = (t, implementation) => {
    const original = prisma.$queryRaw
    let callCount = 0
    prisma.$queryRaw = (...args) => {
        callCount += 1
        return implementation(...args)
    }
    t.after(() => {
        prisma.$queryRaw = original
    })
    return () => callCount
}

test('GET /health is unauthenticated and does not query the database', async (t) => {
    const callCount = replaceQuery(t, async () => {
        throw new Error('Health must not query Prisma')
    })
    const port = await startServer(t)
    const response = await get(port, '/health')

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, { status: 'ok' })
    assert.equal(callCount(), 0)
})

test('GET /health succeeds without Origin and with a disallowed Origin', async (t) => {
    const port = await startServer(t)

    const noOrigin = await get(port, '/health')
    assert.equal(noOrigin.statusCode, 200)

    const disallowedOrigin = await get(port, '/health', {
        Origin: 'https://unlisted.example',
    })
    assert.equal(disallowedOrigin.statusCode, 200)
    assert.deepEqual(
        Object.keys(disallowedOrigin.headers).filter((header) => header.startsWith('access-control-')),
        [],
    )
})

test('GET /ready checks the database and returns a generic unavailable response on failure', async (t) => {
    const callCount = replaceQuery(t, async () => {
        throw new Error('database connection detail must not reach the response')
    })
    t.mock.method(console, 'error', () => {})
    const port = await startServer(t)
    const response = await get(port, '/ready')

    assert.equal(response.statusCode, 503)
    assert.deepEqual(response.body, { status: 'unavailable' })
    assert.equal(callCount(), 1)
    assert.doesNotMatch(JSON.stringify(response.body), /database connection detail/u)
})

test('GET /ready returns ready after its database check and unavailable during shutdown', async (t) => {
    const callCount = replaceQuery(t, async () => [{ '?column?': 1 }])
    const port = await startServer(t)

    const ready = await get(port, '/ready')
    assert.equal(ready.statusCode, 200)
    assert.deepEqual(ready.body, { status: 'ready' })
    assert.equal(callCount(), 1)

    app.locals.isShuttingDown = true
    t.after(() => { delete app.locals.isShuttingDown })
    const shuttingDown = await get(port, '/ready')
    assert.equal(shuttingDown.statusCode, 503)
    assert.deepEqual(shuttingDown.body, { status: 'unavailable' })
    assert.equal(callCount(), 1)
})
