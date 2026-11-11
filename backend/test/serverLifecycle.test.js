import assert from 'node:assert/strict'
import { Agent, createServer, request } from 'node:http'
import { test } from 'node:test'
import {
    configureServerTimeouts,
    createGracefulShutdown,
} from '../src/utils/serverLifecycle.js'

test('configures explicit keep-alive, header, and request timeouts', () => {
    const server = {}
    configureServerTimeouts(server)

    assert.equal(server.keepAliveTimeout, 65_000)
    assert.equal(server.headersTimeout, 66_000)
    assert.equal(server.requestTimeout, 600_000)
})

test('graceful shutdown exits once after HTTP closes and Prisma disconnects', async () => {
    const calls = []
    let closeCallback
    let scheduledCallback
    let intervalCallback
    const app = { locals: {} }
    const server = {
        close(callback) {
            calls.push('close')
            closeCallback = callback
        },
        closeIdleConnections() {
            calls.push('closeIdleConnections')
        },
    }
    const shutdown = createGracefulShutdown({
        server,
        prisma: {
            async $disconnect() {
                calls.push('disconnect')
            },
        },
        app,
        logger: { info: () => {}, error: () => {} },
        schedule(callback, timeout) {
            calls.push(`schedule:${timeout}`)
            scheduledCallback = callback
            return 'timer'
        },
        scheduleInterval(callback, interval) {
            calls.push(`scheduleInterval:${interval}`)
            intervalCallback = callback
            return {
                unref() {
                    calls.push('unrefInterval')
                },
            }
        },
        cancel(timer) {
            calls.push(`cancel:${timer}`)
        },
        cancelInterval() {
            calls.push('cancelInterval')
        },
        forceExit: (code) => calls.push(`exit:${code}`),
    })

    shutdown('SIGTERM')
    shutdown('SIGINT')
    assert.equal(app.locals.isShuttingDown, true)
    assert.deepEqual(calls, [
        'schedule:10000',
        'scheduleInterval:250',
        'unrefInterval',
        'close',
        'closeIdleConnections',
    ])

    closeCallback()
    await new Promise((resolve) => setImmediate(resolve))

    assert.deepEqual(calls, [
        'schedule:10000',
        'scheduleInterval:250',
        'unrefInterval',
        'close',
        'closeIdleConnections',
        'disconnect',
        'cancel:timer',
        'cancelInterval',
        'exit:0',
    ])
    assert.equal(typeof scheduledCallback, 'function')
    assert.equal(typeof intervalCallback, 'function')

    scheduledCallback()
    shutdown('SIGINT')
    assert.equal(calls.filter((call) => call.startsWith('exit:')).length, 1)
    assert.equal(calls.at(-1), 'exit:0')
})

test('uncaught exception shutdown exits with code 1', async () => {
    let closeCallback
    const exitCodes = []
    const shutdown = createGracefulShutdown({
        server: {
            close(callback) {
                closeCallback = callback
            },
            closeIdleConnections() {},
        },
        prisma: { $disconnect: async () => {} },
        app: { locals: {} },
        logger: { info: () => {}, error: () => {} },
        schedule: () => 'timer',
        cancel: () => {},
        forceExit: (code) => exitCodes.push(code),
    })

    shutdown('uncaughtException', 1)
    closeCallback()
    await new Promise((resolve) => setImmediate(resolve))

    assert.deepEqual(exitCodes, [1])
})

test('graceful shutdown force-exits once when HTTP connections do not drain', async () => {
    const calls = []
    let scheduledCallback
    let closeCallback
    const shutdown = createGracefulShutdown({
        server: {
            close(callback) {
                closeCallback = callback
            },
            closeIdleConnections() {},
            closeAllConnections() {
                calls.push('closeAllConnections')
            },
        },
        prisma: {
            $disconnect: async () => {
                calls.push('disconnect')
            },
        },
        app: { locals: {} },
        logger: { info: () => {}, error: () => calls.push('timeoutLogged') },
        schedule(callback) {
            scheduledCallback = callback
            return 'timer'
        },
        cancel: () => {},
        forceExit: (code) => calls.push(`exit:${code}`),
    })

    shutdown('SIGTERM')
    scheduledCallback()
    closeCallback()
    await new Promise((resolve) => setImmediate(resolve))

    assert.deepEqual(calls, ['timeoutLogged', 'closeAllConnections', 'disconnect', 'exit:1'])
})

test('real keep-alive request drains before graceful shutdown exits on Node', async (t) => {
    let requestStarted
    const started = new Promise((resolve) => {
        requestStarted = resolve
    })
    const server = createServer((req, res) => {
        requestStarted()
        setTimeout(() => {
            res.end('completed')
        }, 300)
    })
    server.keepAliveTimeout = 65_000
    server.headersTimeout = 66_000

    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    t.after(() => {
        server.closeAllConnections()
    })

    const agent = new Agent({ keepAlive: true })
    t.after(() => agent.destroy())

    let responseCompletedAt
    const responsePromise = new Promise((resolve, reject) => {
        const req = request({
            host: '127.0.0.1',
            port: server.address().port,
            path: '/',
            agent,
        }, (res) => {
            let body = ''
            res.setEncoding('utf8')
            res.on('data', (chunk) => { body += chunk })
            res.on('end', () => {
                responseCompletedAt = Date.now()
                resolve(body)
            })
        })
        req.on('error', reject)
        req.end()
    })
    await started

    let resolveExit
    const exitPromise = new Promise((resolve) => {
        resolveExit = resolve
    })
    let exitAt
    const shutdown = createGracefulShutdown({
        server,
        prisma: { $disconnect: async () => {} },
        app: { locals: {} },
        logger: { info: () => {}, error: () => {} },
        forceExit: (code) => {
            exitAt = Date.now()
            resolveExit(code)
        },
    })

    shutdown('SIGTERM')
    assert.equal(await responsePromise, 'completed')
    let deadline
    const exitCode = await Promise.race([
        exitPromise,
        new Promise((_, reject) => {
            deadline = setTimeout(() => reject(new Error('Graceful exit exceeded 2 seconds')), 2_000)
        }),
    ])
    clearTimeout(deadline)

    assert.equal(exitCode, 0)
    assert.ok(exitAt >= responseCompletedAt)
    assert.ok(exitAt - responseCompletedAt < 2_000)
})
