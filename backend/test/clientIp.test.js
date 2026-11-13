import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { request as httpRequest } from 'node:http'
import { test } from 'node:test'

const envModule = new URL('../src/config/env.js', import.meta.url).href
const clientIpModule = new URL('../src/utils/clientIp.js', import.meta.url).href
const productionEnv = {
    NODE_ENV: 'production',
    PORT: '5000',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'fake-jwt-secret-for-production-tests-32chars',
    JWT_REFRESH_SECRET: 'fake-refresh-secret-for-production-tests-32chars',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'https://customer.example',
    SITE_URL: 'https://customer.example',
    CLIENT_IP_SOURCE: 'x-real-ip',
    CORS_ORIGINS: 'https://customer.example',
    VERIFICATION_CODE_PEPPER: '0123456789abcdef0123456789abcdef',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
}

Object.assign(process.env, productionEnv)

const { getClientIp } = await import(clientIpModule)
const { default: app } = await import('../src/app.js')
const { loginLimiter } = await import('../src/modules/auth/auth.routes.js')

const makeRequest = (port, { realIp, forwardedFor } = {}) => new Promise((resolve, reject) => {
    const headers = { 'content-type': 'application/json' }
    if (realIp !== undefined) headers['x-real-ip'] = realIp
    if (forwardedFor !== undefined) headers['x-forwarded-for'] = forwardedFor

    const request = httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers,
        agent: false,
    }, (response) => {
        response.resume()
        response.on('end', () => resolve(response.statusCode))
    })

    request.on('error', reject)
    request.end('{}')
})

test('getClientIp uses configured X-Real-IP, not X-Forwarded-For', () => {
    assert.equal(getClientIp({
        headers: {
            'x-real-ip': '198.51.100.10',
            'x-forwarded-for': '203.0.113.8',
        },
        socket: { remoteAddress: '127.0.0.1' },
    }), '198.51.100.10')
})

test('getClientIp falls back to the socket for missing or invalid X-Real-IP', () => {
    const socketAddress = '2001:db8::1'
    assert.equal(getClientIp({ headers: {}, socket: { remoteAddress: socketAddress } }), socketAddress)
    assert.equal(getClientIp({
        headers: { 'x-real-ip': 'not-an-ip', 'x-forwarded-for': '203.0.113.8' },
        socket: { remoteAddress: socketAddress },
    }), socketAddress)
})

test('getClientIp selects the first valid comma-separated X-Real-IP value', () => {
    assert.equal(getClientIp({
        headers: { 'x-real-ip': 'invalid, 2001:db8::2, 198.51.100.2' },
        socket: { remoteAddress: '127.0.0.1' },
    }), '2001:db8::2')
})

test('getClientIp accepts IPv4 and IPv6 addresses', () => {
    assert.equal(getClientIp({
        headers: { 'x-real-ip': '192.0.2.25' },
        socket: { remoteAddress: '127.0.0.1' },
    }), '192.0.2.25')
    assert.equal(getClientIp({
        headers: { 'x-real-ip': '2001:db8:abcd::25' },
        socket: { remoteAddress: '127.0.0.1' },
    }), '2001:db8:abcd::25')
})

test('unknown CLIENT_IP_SOURCE fails production configuration before requests are served', () => {
    const result = spawnSync(process.execPath, [
        '--input-type=module',
        '-e',
        `await import(${JSON.stringify(envModule)})`,
    ], {
        encoding: 'utf8',
        env: {
            ...productionEnv,
            CLIENT_IP_SOURCE: 'x-forwarded-for',
        },
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /CLIENT_IP_SOURCE must be either "socket" or "x-real-ip"/u)
})

test('the real app login limiter groups by X-Real-IP and ignores X-Forwarded-For', async (t) => {
    assert.equal(typeof loginLimiter, 'function')
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
    }))

    const port = server.address().port
    const errors = []
    const originalConsoleError = console.error
    console.error = (...args) => errors.push(args)

    try {
        for (let attempt = 0; attempt < 10; attempt += 1) {
            assert.equal(await makeRequest(port, {
                realIp: '198.51.100.10',
                forwardedFor: `203.0.113.${attempt + 1}`,
            }), 400)
        }
        assert.equal(await makeRequest(port, {
            realIp: '198.51.100.10',
            forwardedFor: '192.0.2.200',
        }), 429)

        assert.equal(await makeRequest(port, {
            realIp: '198.51.100.11',
            forwardedFor: '198.51.100.10',
        }), 400)

        for (let attempt = 0; attempt < 10; attempt += 1) {
            assert.equal(await makeRequest(port, {
                realIp: 'not-an-ip',
                forwardedFor: '192.0.2.210',
            }), 400)
        }
        assert.equal(await makeRequest(port, {
            realIp: 'not-an-ip',
            forwardedFor: '192.0.2.211',
        }), 429)

        assert.equal(await makeRequest(port, {
            realIp: '198.51.100.12',
            forwardedFor: '127.0.0.1',
        }), 400)
        assert.deepEqual(errors, [])
    } finally {
        console.error = originalConsoleError
    }
})
