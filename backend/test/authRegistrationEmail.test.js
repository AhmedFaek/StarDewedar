import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

Object.assign(process.env, {
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const state = {
    mailError: null,
    findUserByEmail: async () => null,
    createError: null,
    refreshResult: { count: 1 },
    persistedRefreshData: null,
    sentMessages: [],
    cooldownResets: [],
    createCalls: [],
    refreshCalls: [],
    findCalls: [],
    updateUserCalls: [],
    events: [],
}

const userRepoUrl = new URL('../src/modules/users/user.repository.js', import.meta.url).href
const authRepoUrl = new URL('../src/modules/auth/auth.repository.js', import.meta.url).href
const mailerUrl = new URL('../src/utils/mailer.js', import.meta.url).href
const emailValidationUrl = new URL('../src/utils/emailValidation.service.js', import.meta.url).href

mock.module(userRepoUrl, {
    exports: {
        findUserByEmail: async (email) => {
            state.events.push('find')
            state.findCalls.push(email)
            return state.findUserByEmail(email)
        },
        createUser: async (data) => {
            state.events.push('create')
            state.createCalls.push(data)
            if (state.createError) throw state.createError
            return { id: 'test-user-id', ...data }
        },
        updateUser: async (...args) => {
            state.updateUserCalls.push(args)
            state.events.push('unconditional-user-update')
        },
    },
})

mock.module(authRepoUrl, {
    exports: {
        resetVerificationResendCooldown: async (...args) => {
            state.events.push('cooldown-reset')
            state.cooldownResets.push(args)
        },
        refreshUnverifiedRegistration: async (...args) => {
            state.events.push('refresh')
            state.refreshCalls.push(args)
            state.persistedRefreshData = args[1]
            return state.refreshResult
        },
    },
})

mock.module(mailerUrl, {
    exports: {
        sendEmail: async (message) => {
            state.events.push('mail')
            state.sentMessages.push(message)
            if (state.mailError) throw state.mailError
            return { messageId: 'test-message-id' }
        },
    },
})

mock.module(emailValidationUrl, {
    exports: {
        validateCustomerEmail: async (email) => ({
            isValid: true,
            normalizedEmail: email.toLowerCase(),
        }),
        normalizeEmail: (email) => email.toLowerCase(),
    },
})

const { register } = await import('../src/modules/auth/auth.service.js')

const registration = {
    name: 'Test Customer',
    email: 'customer@example.com',
    password: 'a-test-password',
}

const makeExpiredUser = (overrides = {}) => ({
    id: 'existing-user-id',
    email: registration.email,
    email_verified: false,
    email_verification_hash: 'old-code-hash',
    email_verification_expires_at: new Date(Date.now() - 1_000),
    email_verification_last_sent: new Date(Date.now() - 61_000),
    ...overrides,
})

const resetState = () => {
    state.mailError = null
    state.findUserByEmail = async () => null
    state.createError = null
    state.refreshResult = { count: 1 }
    state.persistedRefreshData = null
    state.sentMessages.length = 0
    state.cooldownResets.length = 0
    state.createCalls.length = 0
    state.refreshCalls.length = 0
    state.findCalls.length = 0
    state.updateUserCalls.length = 0
    state.events.length = 0
}

const captureLogs = (t) => {
    const logs = []
    t.mock.method(console, 'error', (...args) => logs.push(args.join(' ')))
    return logs
}

const assertNoUnconditionalUserUpdate = () => {
    assert.equal(state.updateUserCalls.length, 0)
    assert.equal(state.events.includes('unconditional-user-update'), false)
}

const assertNoSensitiveLogValues = (logs, password = registration.password, data = null, emailHtml = '') => {
    const output = logs.join('\n')
    assert.doesNotMatch(output, new RegExp(password, 'u'))
    if (data?.password) assert.doesNotMatch(output, new RegExp(data.password, 'u'))
    if (data?.email_verification_hash) {
        assert.doesNotMatch(output, new RegExp(data.email_verification_hash, 'u'))
    }
    const code = emailHtml.match(/(?:code|verification-code)[^0-9]{0,80}([0-9]{6})/i)?.[1]
    if (code) assert.doesNotMatch(output, new RegExp(code, 'u'))
}

test('register reports successful verification email delivery', async (t) => {
    resetState()
    const logs = captureLogs(t)

    const result = await register(registration)

    assert.equal(result.emailSent, true)
    assert.equal(state.sentMessages.length, 1)
    assert.equal(state.cooldownResets.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('register reports delivery failure, releases cooldown, and logs no credentials or codes', async (t) => {
    resetState()
    state.mailError = new Error('SMTP unavailable')
    const logs = captureLogs(t)
    t.after(() => {
        state.mailError = null
    })

    const result = await register(registration)

    assert.deepEqual(result, {
        requiresEmailVerification: true,
        email: registration.email,
        emailSent: false,
        reason: 'send_failed',
        message: 'Registration successful, but we could not send your verification code. Please request a new one.',
    })
    assert.deepEqual(state.cooldownResets, [['test-user-id', null]])
    assert.equal(state.events.indexOf('mail') < state.events.indexOf('cooldown-reset'), true)
    assert.equal(logs.length, 1)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs, registration.password, state.createCalls[0], state.sentMessages[0].html)
    assert.match(logs[0], /auth\.registration_verification_email_failed/u)
})

test('verified account returns Email already exists without update or mail', async (t) => {
    resetState()
    const logs = captureLogs(t)
    state.findUserByEmail = async () => ({
        id: 'verified-user-id',
        email: registration.email,
        email_verified: true,
    })

    await assert.rejects(register(registration), { message: 'Email already exists' })
    assert.equal(state.refreshCalls.length, 0)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('active-code account returns code_pending without update or mail', async (t) => {
    resetState()
    const logs = captureLogs(t)
    state.findUserByEmail = async () => makeExpiredUser({
        email_verification_hash: 'active-code-hash',
        email_verification_expires_at: new Date(Date.now() + 60_000),
    })

    const result = await register(registration)

    assert.equal(result.emailSent, false)
    assert.equal(result.reason, 'code_pending')
    assert.equal(state.refreshCalls.length, 0)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('expired account refreshes once with full data before sending email', async (t) => {
    resetState()
    const logs = captureLogs(t)
    state.findUserByEmail = async () => makeExpiredUser()
    const updatedRegistration = {
        ...registration,
        name: 'Updated Customer',
        password: 'a-new-test-password',
    }

    const result = await register(updatedRegistration)

    assert.equal(result.emailSent, true)
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.events.indexOf('refresh') < state.events.indexOf('mail'), true)
    assert.equal(state.events.filter((event) => event === 'refresh').length, 1)
    const [userId, data, now, cooldownSeconds] = state.refreshCalls[0]
    assert.equal(userId, 'existing-user-id')
    assert.equal(data.name, updatedRegistration.name)
    assert.notEqual(data.password, updatedRegistration.password)
    assert.equal(data.phone_number, null)
    assert.equal(data.whatsapp_number, null)
    assert.equal(data.company_name, null)
    assert.equal(data.reset_password_token, null)
    assert.equal(data.reset_password_expires, null)
    assert.equal(data.hashed_refresh_token, null)
    assert.notEqual(data.email_verification_hash, 'old-code-hash')
    assert.ok(data.email_verification_expires_at > now)
    assert.equal(data.email_verification_attempts, 0)
    assert.equal(data.email_verification_last_sent, now)
    assert.equal(cooldownSeconds, 60)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs, updatedRegistration.password, data, state.sentMessages[0].html)
})

test('missing verification hash or expiry also refreshes through one conditional update', async (t) => {
    for (const [label, overrides] of [
        ['missing hash', { email_verification_hash: null }],
        ['missing expiry', { email_verification_expires_at: null }],
        ['both missing', { email_verification_hash: null, email_verification_expires_at: null }],
    ]) {
        await t.test(label, async (subtest) => {
            resetState()
            const logs = captureLogs(subtest)
            state.findUserByEmail = async () => makeExpiredUser(overrides)

            const result = await register(registration)

            assert.equal(result.emailSent, true)
            assert.equal(state.refreshCalls.length, 1)
            assert.equal(state.events.indexOf('refresh') < state.events.indexOf('mail'), true)
            assertNoUnconditionalUserUpdate()
            assertNoSensitiveLogValues(logs, registration.password, state.refreshCalls[0][1], state.sentMessages[0].html)
        })
    }
})

test('expired code with active cooldown returns 429 without sending mail', async (t) => {
    resetState()
    const logs = captureLogs(t)
    state.findUserByEmail = async () => makeExpiredUser({
        email_verification_last_sent: new Date(),
    })
    state.refreshResult = { count: 0 }

    await assert.rejects(register(registration), { status: 429, code: 'RESEND_COOLDOWN' })
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('zero-row update re-read routes verified account to existing-account error', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const expiredUser = makeExpiredUser()
    state.findUserByEmail = async () => state.findCalls.length === 1
        ? expiredUser
        : { ...expiredUser, email_verified: true }
    state.refreshResult = { count: 0 }

    await assert.rejects(register(registration), { message: 'Email already exists' })
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('zero-row update re-read routes active code to code_pending without another write or mail', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const expiredUser = makeExpiredUser()
    state.findUserByEmail = async () => state.findCalls.length === 1
        ? expiredUser
        : {
            ...expiredUser,
            email_verification_hash: 'raced-active-hash',
            email_verification_expires_at: new Date(Date.now() + 60_000),
        }
    state.refreshResult = { count: 0 }

    const result = await register(registration)

    assert.equal(result.reason, 'code_pending')
    assert.equal(result.emailSent, false)
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('zero-row update re-read routes expired account with active cooldown to 429', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const expiredUser = makeExpiredUser()
    state.findUserByEmail = async () => state.findCalls.length === 1
        ? expiredUser
        : { ...expiredUser, email_verification_last_sent: new Date() }
    state.refreshResult = { count: 0 }

    await assert.rejects(register(registration), { status: 429, code: 'RESEND_COOLDOWN' })
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('zero-row update re-read handles a missing account with a generic state-change error', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const expiredUser = makeExpiredUser()
    state.findUserByEmail = async () => state.findCalls.length === 1 ? expiredUser : null
    state.refreshResult = { count: 0 }

    await assert.rejects(register(registration), {
        status: 409,
        code: 'REGISTRATION_STATE_CHANGED',
    })
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('SMTP failure after refresh retains data and attempts a cooldown reset', async (t) => {
    resetState()
    const logs = captureLogs(t)
    state.findUserByEmail = async () => makeExpiredUser()
    state.mailError = new Error('SMTP unavailable')
    t.after(() => {
        state.mailError = null
    })

    const result = await register(registration)
    const [, data] = state.refreshCalls[0]

    assert.equal(result.emailSent, false)
    assert.equal(result.reason, 'send_failed')
    assert.equal(state.persistedRefreshData, data)
    assert.equal(data.name, registration.name)
    assert.equal(data.reset_password_token, null)
    assert.equal(data.email_verification_attempts, 0)
    assert.deepEqual(state.cooldownResets, [['existing-user-id', null]])
    assert.deepEqual(state.events.slice(-3), ['refresh', 'mail', 'cooldown-reset'])
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs, registration.password, data, state.sentMessages[0].html)
})

test('P2002 race routes verified account through existing-account branch', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const verifiedUser = { id: 'raced-user-id', email: registration.email, email_verified: true }
    state.findUserByEmail = async () => state.findCalls.length === 1 ? null : verifiedUser
    state.createError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })

    await assert.rejects(register(registration), { message: 'Email already exists' })
    assert.equal(state.createCalls.length, 1)
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.refreshCalls.length, 0)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('P2002 race routes active-code account through code_pending without update or mail', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const activeUser = makeExpiredUser({
        email_verification_hash: 'active-code-hash',
        email_verification_expires_at: new Date(Date.now() + 60_000),
    })
    state.findUserByEmail = async () => state.findCalls.length === 1 ? null : activeUser
    state.createError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })

    const result = await register(registration)

    assert.equal(result.reason, 'code_pending')
    assert.equal(result.emailSent, false)
    assert.equal(state.createCalls.length, 1)
    assert.equal(state.findCalls.length, 2)
    assert.equal(state.refreshCalls.length, 0)
    assert.equal(state.sentMessages.length, 0)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs)
})

test('P2002 race routes expired account through conditional refresh then mail', async (t) => {
    resetState()
    const logs = captureLogs(t)
    const expiredUser = makeExpiredUser()
    state.findUserByEmail = async () => state.findCalls.length === 1 ? null : expiredUser
    state.createError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })

    const result = await register(registration)

    assert.equal(result.emailSent, true)
    assert.equal(state.createCalls.length, 1)
    assert.equal(state.refreshCalls.length, 1)
    assert.equal(state.events.indexOf('refresh') < state.events.indexOf('mail'), true)
    assertNoUnconditionalUserUpdate()
    assertNoSensitiveLogValues(logs, registration.password, state.refreshCalls[0][1], state.sentMessages[0].html)
})
