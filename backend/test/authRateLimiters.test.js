import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { request as httpRequest } from 'node:http'
import { test } from 'node:test'
import express from 'express'
import { createTwoTierIpLimiters } from '../src/modules/auth/authRateLimiters.js'

const startServer = async (t, route) => {
    const app = express()
    app.post('/auth', ...route)
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

const post = (port, headers = {}) => (
    new Promise((resolve, reject) => {
        const req = httpRequest({
            host: '127.0.0.1',
            port,
            path: '/auth',
            method: 'POST',
            headers,
        }, (res) => {
            res.resume()
            res.on('end', () => resolve(res.statusCode))
        })
        req.on('error', reject)
        req.end()
    })
)

const proceed = (req, res) => res.sendStatus(204)

test('coarse IP limiter allows 30 requests per 15 minutes and rejects the next', async (t) => {
    const { coarseLimiter } = createTwoTierIpLimiters('Rate limited')
    const port = await startServer(t, [coarseLimiter, proceed])

    for (let attempt = 0; attempt < 30; attempt += 1) {
        assert.equal(await post(port), 204)
    }
    assert.equal(await post(port), 429)
})

test('passed-challenge IP limiter allows 10 requests per hour and ignores rejected challenges', async (t) => {
    const { coarseLimiter, passedChallengeLimiter } = createTwoTierIpLimiters('Rate limited')
    const challenge = (req, res, next) => (
        req.get('x-test-challenge') === 'valid' ? next() : res.sendStatus(403)
    )
    const port = await startServer(t, [
        coarseLimiter,
        challenge,
        passedChallengeLimiter,
        proceed,
    ])

    for (let attempt = 0; attempt < 5; attempt += 1) {
        assert.equal(await post(port), 403)
    }
    for (let attempt = 0; attempt < 10; attempt += 1) {
        assert.equal(await post(port, { 'x-test-challenge': 'valid' }), 204)
    }
    assert.equal(await post(port, { 'x-test-challenge': 'valid' }), 429)
})
