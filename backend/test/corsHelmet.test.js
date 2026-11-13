import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { request as httpRequest } from 'node:http'
import { test } from 'node:test'
import env from '../src/config/env.js'
import app from '../src/app.js'

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

const request = (port, { method = 'GET', path = '/', headers = {}, body } = {}) => (
    new Promise((resolve, reject) => {
        const req = httpRequest({
            host: '127.0.0.1',
            port,
            path,
            method,
            headers,
        }, (res) => {
            res.resume()
            res.on('end', () => resolve(res))
        })
        req.on('error', reject)
        req.end(body)
    })
)

test('CORS allows configured origins and exact API preflight headers without credentials', async (t) => {
    const port = await startServer(t)
    const origin = env.corsOrigins[0]
    const response = await request(port, {
        method: 'OPTIONS',
        path: '/api/auth/login',
        headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,x-turnstile-token,x-form-elapsed-ms',
        },
    })

    assert.equal(response.statusCode, 204)
    assert.equal(response.headers['access-control-allow-origin'], origin)
    assert.match(response.headers.vary || '', /Origin/u)
    assert.equal(response.headers['access-control-allow-credentials'], undefined)
    assert.equal(response.headers['access-control-max-age'], '86400')
    assert.match(response.headers['access-control-allow-methods'], /\bPOST\b/u)
    for (const header of ['authorization', 'x-turnstile-token', 'x-form-elapsed-ms']) {
        assert.ok(response.headers['access-control-allow-headers']
            .toLowerCase()
            .split(',')
            .map((value) => value.trim())
            .includes(header))
    }
})

test('CORS omits Access-Control-Allow-Origin for a disallowed origin on preflight and normal requests', async (t) => {
    const port = await startServer(t)
    const preflight = await request(port, {
        method: 'OPTIONS',
        path: '/api/auth/login',
        headers: {
            Origin: 'https://not-allowed.invalid',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        },
    })
    const normal = await request(port, {
        path: '/',
        headers: { Origin: 'https://not-allowed.invalid' },
    })

    assert.equal(preflight.statusCode, 200)
    assert.equal(preflight.headers['access-control-allow-origin'], undefined)
    assert.equal(normal.headers['access-control-allow-origin'], undefined)
})

test('CORS allows requests without an Origin header', async (t) => {
    const port = await startServer(t)
    const response = await request(port)

    assert.equal(response.statusCode, 200)
    assert.equal(response.headers['access-control-allow-origin'], undefined)
})

test('CORS rejects the opaque null origin', async (t) => {
    const port = await startServer(t)
    const response = await request(port, {
        method: 'OPTIONS',
        path: '/api/auth/login',
        headers: {
            Origin: 'null',
            'Access-Control-Request-Method': 'POST',
        },
    })

    assert.equal(response.headers['access-control-allow-origin'], undefined)
    assert.equal(response.headers['access-control-allow-credentials'], undefined)
})

test('CORS normalizes trailing slash configuration to the browser origin', () => {
    const appUrl = new URL('../src/app.js', import.meta.url).href
    const script = `
        process.env.NODE_ENV = 'production'
        process.env.PORT = '5000'
        process.env.DATABASE_URL = 'postgresql://localhost:5432/test'
        process.env.JWT_SECRET = 'fake-jwt-secret-for-production-tests-32chars'
        process.env.JWT_REFRESH_SECRET = 'fake-refresh-secret-for-production-tests-32chars'
        process.env.CLOUDINARY_NAME = 'test-cloud'
        process.env.CLOUDINARY_KEY = 'test-key'
        process.env.CLOUDINARY_SECRET = 'test-secret'
        process.env.YAHOO_EMAIL = 'test@example.invalid'
        process.env.YAHOO_PASSWORD = 'test-password'
        process.env.FRONTEND_URL = 'https://trailing.example'
        process.env.SITE_URL = 'https://trailing.example'
        process.env.CLIENT_IP_SOURCE = 'x-real-ip'
        process.env.CORS_ORIGINS = 'https://trailing.example/'
        process.env.VERIFICATION_CODE_PEPPER = '0123456789abcdef0123456789abcdef'
        process.env.TURNSTILE_SECRET_KEY = 'test-secret'
        const { default: app } = await import(${JSON.stringify(appUrl)})
        const server = app.listen(0, '127.0.0.1', async () => {
            const response = await fetch('http://127.0.0.1:' + server.address().port + '/', {
                headers: { Origin: 'https://trailing.example' }
            })
            console.log(response.headers.get('access-control-allow-origin'))
            server.close()
        })
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        encoding: 'utf8',
        env: { ...process.env },
    })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim().split(/\r?\n/u).at(-1), 'https://trailing.example')
})

test('CORS preflight does not consume a real login rate-limit counter', async (t) => {
    const port = await startServer(t)
    const origin = env.corsOrigins[0]
    const preflight = await request(port, {
        method: 'OPTIONS',
        path: '/api/auth/login',
        headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        },
    })
    assert.equal(preflight.statusCode, 204)

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await request(port, {
            method: 'POST',
            path: '/api/auth/login',
            headers: {
                Origin: origin,
                'Content-Type': 'application/json',
            },
        })
        assert.equal(response.statusCode, 400)
    }

    const limited = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        headers: {
            Origin: origin,
            'Content-Type': 'application/json',
        },
    })
    assert.equal(limited.statusCode, 429)
})

test('Helmet API defaults include security headers and omit HSTS outside production', async (t) => {
    const port = await startServer(t)
    const response = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
    })

    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8')
    assert.ok(response.headers['content-security-policy'])
    assert.equal(response.headers['cross-origin-embedder-policy'], undefined)
    assert.equal(response.headers['cross-origin-opener-policy'], 'same-origin')
    assert.equal(response.headers['cross-origin-resource-policy'], 'same-origin')
    assert.equal(response.headers['origin-agent-cluster'], '?1')
    assert.equal(response.headers['referrer-policy'], 'no-referrer')
    assert.equal(response.headers['x-content-type-options'], 'nosniff')
    assert.equal(response.headers['x-dns-prefetch-control'], 'off')
    assert.equal(response.headers['x-download-options'], 'noopen')
    assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN')
    assert.equal(response.headers['x-permitted-cross-domain-policies'], 'none')
    assert.equal(response.headers['x-xss-protection'], '0')
    assert.equal(response.headers['strict-transport-security'], undefined)
})

test('Helmet enables HSTS in production', () => {
    const appUrl = new URL('../src/app.js', import.meta.url).href
    const script = `
        process.env.NODE_ENV = 'production'
        process.env.PORT = '5000'
        process.env.DATABASE_URL = 'postgresql://localhost:5432/test'
        process.env.JWT_SECRET = 'fake-jwt-secret-for-production-tests-32chars'
        process.env.JWT_REFRESH_SECRET = 'fake-refresh-secret-for-production-tests-32chars'
        process.env.CLOUDINARY_NAME = 'test-cloud'
        process.env.CLOUDINARY_KEY = 'test-key'
        process.env.CLOUDINARY_SECRET = 'test-secret'
        process.env.YAHOO_EMAIL = 'test@example.invalid'
        process.env.YAHOO_PASSWORD = 'test-password'
        process.env.FRONTEND_URL = 'https://customer.example'
        process.env.SITE_URL = 'https://customer.example'
        process.env.CLIENT_IP_SOURCE = 'x-real-ip'
        process.env.CORS_ORIGINS = 'https://customer.example'
        process.env.VERIFICATION_CODE_PEPPER = '0123456789abcdef0123456789abcdef'
        process.env.TURNSTILE_SECRET_KEY = 'test-secret'
        const { default: app } = await import(${JSON.stringify(appUrl)})
        const server = app.listen(0, '127.0.0.1', async () => {
            const response = await fetch('http://127.0.0.1:' + server.address().port + '/')
            console.log(response.headers.get('strict-transport-security'))
            server.close()
        })
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        encoding: 'utf8',
        env: { ...process.env },
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout.trim().split(/\r?\n/u).at(-1), /max-age=31536000; includeSubDomains/u)
})
