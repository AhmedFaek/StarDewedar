import assert from 'node:assert/strict'
import { test } from 'node:test'

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
    FRONTEND_URL: 'https://customer.example',
    ADMIN_URL: 'https://admin.customer.example',
    LOGO_URL: 'https://customer.example/logo.png',
    VERIFICATION_CODE_PEPPER: '0123456789abcdef0123456789abcdef',
    API_PUBLIC_URL: 'http://api.example.invalid/api',
    NODE_ENV: 'test',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const [{ default: app }, { default: prisma }] = await Promise.all([
    import('../src/app.js'),
    import('../src/utils/prisma.js'),
])

test('HTTP error logging redacts message and attachment token while preserving response bodies', async (t) => {
    const token = 'A'.repeat(43)
    const email = 'private.person@example.com'
    const phone = '+1-202-555-0147'
    const privateMessage = `Lookup failed for ${email} ${phone} token=${token}`
    let failure = new Error(privateMessage)
    const originalFindUnique = prisma.emailAttachmentAccessToken.findUnique
    prisma.emailAttachmentAccessToken.findUnique = async () => {
        throw failure
    }
    t.after(() => {
        prisma.emailAttachmentAccessToken.findUnique = originalFindUnique
    })

    const originalNodeEnv = process.env.NODE_ENV
    const originalConsoleError = console.error
    const logs = []
    process.env.NODE_ENV = 'development'
    console.error = (...values) => logs.push(values)
    t.after(() => {
        process.env.NODE_ENV = originalNodeEnv
        console.error = originalConsoleError
    })

    const server = app.listen(0, '127.0.0.1')
    t.after(() => new Promise((resolve, reject) => {
        server.closeAllConnections()
        server.close((error) => error ? reject(error) : resolve())
    }))
    await new Promise((resolve) => server.once('listening', resolve))
    const url = `http://127.0.0.1:${server.address().port}/api/attachments/email/${token}`

    const developmentResponse = await fetch(url)
    const developmentBody = await developmentResponse.json()
    assert.equal(developmentResponse.status, 500)
    assert.deepEqual(Object.keys(developmentBody).sort(), ['message', 'stack'])
    assert.equal(developmentBody.message, privateMessage)
    assert.match(developmentBody.stack, /Lookup failed/u)

    assert.equal(logs.length, 1)
    assert.equal(logs[0][1].method, 'GET')
    assert.equal(logs[0][1].route, '/email/:token')
    assert.equal(logs[0][1].status, 500)
    assert.equal(Object.hasOwn(logs[0][1], 'message'), false)
    assert.equal(JSON.stringify(logs).includes(email), false)
    assert.equal(JSON.stringify(logs).includes(phone), false)
    assert.equal(JSON.stringify(logs).includes(token), false)

    failure = 'non-Error failure'
    process.env.NODE_ENV = 'production'
    await assert.doesNotReject(async () => {
        const productionResponse = await fetch(url)
        const productionBody = await productionResponse.json()
        assert.equal(productionResponse.status, 500)
        assert.deepEqual(productionBody, { message: 'Internal Server Error' })
    })

    assert.equal(logs.length, 2)
    assert.equal(logs[1][1].errorName, 'UnknownError')
    assert.deepEqual(logs[1][1].frames, [])
    assert.equal(JSON.stringify(logs).includes(token), false)

    failure = new Error(privateMessage)
    process.env.NODE_ENV = 'test'
    const testResponse = await fetch(url)
    const testBody = await testResponse.json()
    assert.equal(testResponse.status, 500)
    assert.deepEqual(Object.keys(testBody).sort(), ['message', 'stack'])
    assert.equal(testBody.message, privateMessage)

    failure = new Error(privateMessage)
    process.env.NODE_ENV = 'staging'
    const stagingResponse = await fetch(url)
    assert.equal(stagingResponse.status, 500)
    assert.deepEqual(await stagingResponse.json(), { message: 'Internal Server Error' })

    failure = new Error(privateMessage)
    delete process.env.NODE_ENV
    const unsetResponse = await fetch(url)
    assert.equal(unsetResponse.status, 500)
    assert.deepEqual(await unsetResponse.json(), { message: 'Internal Server Error' })

    assert.equal(logs.length, 5)
    assert.equal(JSON.stringify(logs).includes(token), false)
})
