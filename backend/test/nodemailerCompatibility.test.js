import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import nodemailer from 'nodemailer'

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'mailer-test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const [
    { transporter, sendEmail },
    { createSdcMonogramAttachment, SDC_MONOGRAM_CID },
    { loginSchema },
] = await Promise.all([
    import('../src/utils/mailer.js'),
    import('../src/utils/email.template.js'),
    import('../src/modules/auth/auth.validation.js'),
])

const createStreamTransport = () => nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
})

test('Nodemailer default ESM import builds the production SMTP transport options', () => {
    assert.equal(typeof nodemailer.createTransport, 'function')
    const options = {
        host: 'smtp.mail.yahoo.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.YAHOO_EMAIL,
            pass: process.env.YAHOO_PASSWORD,
        },
        connectionTimeout: 30_000,
        greetingTimeout: 30_000,
        socketTimeout: 120_000,
    }

    const transport = nodemailer.createTransport(options)
    assert.equal(transport.options.host, 'smtp.mail.yahoo.com')
    assert.equal(transport.options.port, 465)
    assert.equal(transport.options.secure, true)
    assert.deepEqual(transport.options.auth, options.auth)
    assert.equal(transport.options.connectionTimeout, 30_000)
    assert.equal(transport.options.greetingTimeout, 30_000)
    assert.equal(transport.options.socketTimeout, 120_000)

    assert.equal(transporter.options.host, options.host)
    assert.equal(transporter.options.port, options.port)
    assert.equal(transporter.options.secure, options.secure)
    assert.deepEqual(transporter.options.auth, options.auth)
    assert.equal(transporter.options.connectionTimeout, options.connectionTimeout)
    assert.equal(transporter.options.greetingTimeout, options.greetingTimeout)
    assert.equal(transporter.options.socketTimeout, options.socketTimeout)
})

test('stream transport serializes the local PNG CID attachment and HTML reference', async () => {
    const attachment = createSdcMonogramAttachment()
    const { message } = await createStreamTransport().sendMail({
        from: 'sender@example.invalid',
        to: 'recipient@example.invalid',
        subject: 'CID serialization',
        html: `<img src="cid:${SDC_MONOGRAM_CID}" alt="Logo" />`,
        attachments: [attachment],
    })
    const mime = message.toString('utf8')

    assert.match(mime, new RegExp(`Content-ID: <${SDC_MONOGRAM_CID}>`, 'i'))
    assert.match(mime, new RegExp(`src="cid:${SDC_MONOGRAM_CID}"`))
})

test('subject CRLF injection does not add a Bcc header or recipient', async () => {
    const { message, envelope } = await createStreamTransport().sendMail({
        from: 'sender@example.invalid',
        to: 'recipient@example.invalid',
        subject: 'Normal subject\r\nBcc: attacker@example.com',
        text: 'Test',
    })
    const mime = message.toString('utf8')

    assert.doesNotMatch(mime, /^Bcc:/im)
    assert.deepEqual(envelope.to, ['recipient@example.invalid'])
})

test('stream transport serializes regular From, To, and Reply-To addresses', async () => {
    const { message, envelope } = await createStreamTransport().sendMail({
        from: 'Star Dewedar <sender@example.invalid>',
        to: 'Customer <recipient@example.invalid>',
        replyTo: 'Support <support@example.invalid>',
        subject: 'Address serialization',
        text: 'Test',
    })
    const mime = message.toString('utf8')

    assert.match(mime, /^From: Star Dewedar <sender@example\.invalid>$/im)
    assert.match(mime, /^To: Customer <recipient@example\.invalid>$/im)
    assert.match(mime, /^Reply-To: Support <support@example\.invalid>$/im)
    assert.deepEqual(envelope.from, 'sender@example.invalid')
    assert.deepEqual(envelope.to, ['recipient@example.invalid'])
})

test('a validator-accepted maximum-length recipient is parsed in under 100 ms', async () => {
    const domain = [
        'a'.repeat(63),
        'b'.repeat(63),
        'c'.repeat(63),
        'd'.repeat(60),
    ].join('.')
    const address = `x@${domain}`
    assert.equal(address.length, 254)
    assert.equal(loginSchema.safeParse({ email: address, password: 'valid1' }).success, true)

    const transport = createStreamTransport()
    await transport.sendMail({
        from: 'sender@example.invalid',
        to: 'warmup@example.invalid',
        subject: 'Warmup',
        text: 'Test',
    })
    const startedAt = performance.now()
    const result = await transport.sendMail({
        from: 'sender@example.invalid',
        to: address,
        subject: 'Maximum-length recipient',
        text: 'Test',
    })
    const elapsedMs = performance.now() - startedAt

    assert.deepEqual(result.envelope.to, [address])
    assert.ok(elapsedMs < 100, `Recipient parsing took ${elapsedMs.toFixed(2)} ms`)
})

test('sendEmail logs a sanitized failure and rethrows the transport error', async (t) => {
    const transportError = Object.assign(new Error('SMTP delivery failed'), {
        code: 'ECONNECTION',
    })
    const logged = []
    t.mock.method(transporter, 'sendMail', async () => {
        throw transportError
    })
    t.mock.method(console, 'error', (...args) => {
        logged.push(args)
    })

    await assert.rejects(sendEmail({
        to: 'recipient@example.invalid',
        subject: 'Failure handling',
        html: '<p>Test</p>',
    }), (error) => error === transportError)

    assert.equal(logged.length, 1)
    assert.equal(logged[0][0], '[mailer] Failed to send email')
    assert.deepEqual(logged[0][1], {
        event: 'email_delivery_failed',
        errorCode: 'ECONNECTION',
        errorName: 'Error',
    })
})
