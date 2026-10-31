import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createTurnstileVerifier } from '../src/middleware/turnstile.middleware.js'

const request = (token = 'test-token') => ({
    headers: token == null ? {} : { 'x-turnstile-token': token },
    ip: '192.0.2.10',
})

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

const siteverifyResponse = (payload, { ok = true, status = 200 } = {}) => ({
    ok,
    status,
    json: async () => payload,
})

const runVerifier = async (middleware, req = request()) => {
    const res = response()
    let nextCalled = false
    await middleware(req, res, () => {
        nextCalled = true
    })
    return { res, nextCalled }
}

test('rejects a missing or blank header token without calling Siteverify', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    let fetchCalled = false
    t.mock.method(globalThis, 'fetch', async () => {
        fetchCalled = true
    })

    for (const token of [null, '', '  ']) {
        const { res, nextCalled } = await runVerifier(createTurnstileVerifier(), request(token))
        assert.equal(res.statusCode, 400)
        assert.equal(nextCalled, false)
    }

    assert.equal(fetchCalled, false)
})

test('accepts a valid token with the expected action and sends the expected Siteverify fields', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    let requestOptions
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        requestOptions = options
        return siteverifyResponse({ success: true, action: 'public_request' })
    })

    const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
    const form = new URLSearchParams(requestOptions.body)

    assert.equal(res.statusCode, null)
    assert.equal(nextCalled, true)
    assert.equal(requestOptions.signal instanceof AbortSignal, true)
    assert.equal(form.get('secret'), 'test-secret')
    assert.equal(form.get('response'), 'test-token')
    assert.equal(form.get('remoteip'), '192.0.2.10')
})

test('rejects invalid and expired or replayed tokens with 403', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'

    for (const code of ['invalid-input-response', 'timeout-or-duplicate']) {
        t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
            success: false,
            'error-codes': [code],
        }))

        const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
        assert.equal(res.statusCode, 403)
        assert.equal(nextCalled, false)
        t.mock.reset()
    }
})

test('rejects a token with an unexpected action', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
        success: true,
        action: 'other_action',
    }))

    const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
    assert.equal(res.statusCode, 403)
    assert.equal(nextCalled, false)
})

test('treats malformed Siteverify responses as unavailable', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({ success: 'true' }))

    const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
    assert.equal(res.statusCode, 503)
    assert.equal(nextCalled, false)
})

test('treats provider configuration and internal errors as unavailable', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'

    for (const code of ['invalid-input-secret', 'internal-error']) {
        t.mock.method(globalThis, 'fetch', async () => siteverifyResponse({
            success: false,
            'error-codes': [code],
        }))

        const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
        assert.equal(res.statusCode, 503)
        assert.equal(nextCalled, false)
        t.mock.reset()
    }
})

test('treats non-OK Siteverify HTTP responses as unavailable', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    t.mock.method(globalThis, 'fetch', async () => siteverifyResponse(null, {
        ok: false,
        status: 502,
    }))

    const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
    assert.equal(res.statusCode, 503)
    assert.equal(nextCalled, false)
})

test('aborts the outbound fetch on timeout and returns 503', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    let fetchAborted = false
    const middleware = createTurnstileVerifier({
        timeoutMs: 10,
        fetchImpl: (_url, options) => new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
                fetchAborted = true
                reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
            }, { once: true })
        }),
    })

    const { res, nextCalled } = await runVerifier(middleware)
    assert.equal(fetchAborted, true)
    assert.equal(res.statusCode, 503)
    assert.equal(nextCalled, false)
})

test('fails closed when the secret is not configured', async (t) => {
    delete process.env.TURNSTILE_SECRET_KEY
    t.mock.method(globalThis, 'fetch', async () => {
        assert.fail('Siteverify must not be called without a configured secret')
    })

    const { res, nextCalled } = await runVerifier(createTurnstileVerifier())
    assert.equal(res.statusCode, 503)
    assert.equal(nextCalled, false)
})

test('request routes verify before Multer and contact remains header-compatible', async () => {
    const routeFiles = [
        ['visitRequests/visit.routes.js', /router\.post\('\/', visitLimiter,\s*verifyTurnstile,\s*singleFileUpload,\s*controller\.createVisit\)/],
        ['quoteRequests/quote.routes.js', /router\.post\('\/', quoteLimiter,\s*verifyTurnstile,\s*singleFileUpload,\s*controller\.createQuote\)/],
        ['boqRequests/boq.routes.js', /router\.post\('\/', boqLimiter,\s*verifyTurnstile,\s*boqUpload,\s*controller\.createBOQ\)/],
        ['contactMessages/contact.routes.js', /router\.post\('\/', contactLimiter,\s*verifyTurnstile,\s*validate\(createContactSchema\),\s*controller\.createContact\)/],
    ]

    for (const [file, routePattern] of routeFiles) {
        const source = await readFile(new URL(`../src/modules/${file}`, import.meta.url), 'utf8')
        assert.match(source, routePattern, `${file} must run Turnstile before parsing or validation`)
    }
})
