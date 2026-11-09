import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { request as httpRequest } from 'node:http'
import { test } from 'node:test'
import express from 'express'
import { createTwoTierIpLimiters } from '../src/modules/auth/authRateLimiters.js'

const routeConfigs = [
    {
        path: '/quote',
        max: 10,
        message: 'Too many quote requests submitted. Please try again later.',
    },
    {
        path: '/visit',
        max: 10,
        message: 'Too many visit requests submitted. Please try again later.',
    },
    {
        path: '/contact',
        max: 10,
        message: 'Too many contact messages sent. Please try again later.',
    },
    {
        path: '/boq',
        max: 5,
        message: 'Too many BOQ requests submitted. Please try again later.',
    },
]

const startServer = async (t) => {
    const app = express()
    for (const { path, max, message } of routeConfigs) {
        const { coarseLimiter, passedChallengeLimiter } = createTwoTierIpLimiters(
            message,
            { passedChallengeMax: max }
        )
        app.post(
            path,
            coarseLimiter,
            (req, res, next) => (
                req.get('x-test-challenge') === 'valid' ? next() : res.sendStatus(403)
            ),
            passedChallengeLimiter,
            (req, res) => res.sendStatus(204)
        )
    }

    const server = createServer(app)
    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
    }))
    return server.address().port
}

const post = (port, path, headers = {}) => (
    new Promise((resolve, reject) => {
        const req = httpRequest({
            host: '127.0.0.1',
            port,
            path,
            method: 'POST',
            headers,
        }, (res) => {
            let body = ''
            res.setEncoding('utf8')
            res.on('data', (chunk) => { body += chunk })
            res.on('end', () => {
                let parsedBody = null
                if (body) {
                    try {
                        parsedBody = JSON.parse(body)
                    } catch {
                        parsedBody = body
                    }
                }
                resolve({ statusCode: res.statusCode, body: parsedBody })
            })
        })
        req.on('error', reject)
        req.end()
    })
)

test('public request strict limiters enforce per-route hourly counts and response messages', async (t) => {
    const port = await startServer(t)

    for (const { path, max, message } of routeConfigs) {
        for (let attempt = 0; attempt < max; attempt += 1) {
            assert.equal(
                (await post(port, path, { 'x-test-challenge': 'valid' })).statusCode,
                204,
                path
            )
        }

        assert.deepEqual(await post(port, path, { 'x-test-challenge': 'valid' }), {
            statusCode: 429,
            body: { message },
        }, path)
    }
})

test('public request coarse limiters run before challenge and keep independent route counters', async (t) => {
    const port = await startServer(t)

    for (let attempt = 0; attempt < 30; attempt += 1) {
        assert.equal((await post(port, '/quote')).statusCode, 403)
    }
    assert.deepEqual(await post(port, '/quote'), {
        statusCode: 429,
        body: { message: routeConfigs[0].message },
    })

    assert.equal((await post(port, '/visit')).statusCode, 403)
    assert.equal((await post(port, '/visit', { 'x-test-challenge': 'valid' })).statusCode, 204)
})

test('auth limiter defaults remain 30 per 15 minutes and 10 per hour', async (t) => {
    const { coarseLimiter, passedChallengeLimiter } = createTwoTierIpLimiters('Rate limited')
    const port = await (async () => {
        const app = express()
        app.post('/auth', coarseLimiter, passedChallengeLimiter, (_req, res) => res.sendStatus(204))
        const server = createServer(app)
        await new Promise((resolve, reject) => {
            server.once('error', reject)
            server.listen(0, '127.0.0.1', resolve)
        })
        t.after(() => new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()))
        }))
        return server.address().port
    })()

    for (let attempt = 0; attempt < 10; attempt += 1) {
        assert.equal((await post(port, '/auth')).statusCode, 204)
    }
    assert.equal((await post(port, '/auth')).statusCode, 429)
})
