import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BCRYPT_SALT_ROUNDS } from '../src/utils/passwordPolicy.js'
import {
    runBootstrapCli,
} from '../scripts/create-first-super-admin.js'

const EMAIL = '  FIRST.ADMIN@example.invalid '
const NORMALIZED_EMAIL = 'first.admin@example.invalid'
const NAME = 'First Admin'
const PASSWORD = 'StrongBootstrapPassword123'
const DATABASE_URL = 'postgresql://db-user:db-password@db.example.test:5432/bootstrap_test'
const DATABASE_NAME = 'bootstrap_test'

const createLogger = () => {
    const entries = []
    return {
        entries,
        info: (...values) => entries.push(['info', ...values]),
        error: (...values) => entries.push(['error', ...values]),
    }
}

const createHarness = ({
    superAdminCount = 0,
    existingEmail = null,
    argv = [EMAIL, NAME],
    input = { isTTY: false },
    prompt = async () => {
        throw new Error('Unexpected prompt')
    },
    env = {},
    hasher = async (password, rounds) => `fake-hash:${rounds}:${password}`,
    createDatabaseError,
    disconnectError,
} = {}) => {
    const state = {
        createDatabaseCalls: [],
        disconnectCalls: 0,
        findUniqueCalls: [],
        createCalls: [],
        hashCalls: [],
        lockCalls: 0,
        exitCalls: [],
    }
    const client = {
        $disconnect: async () => {
            state.disconnectCalls += 1
            if (disconnectError) throw disconnectError
        },
        transaction: {
            user: {
                findUnique: async (query) => {
                    state.findUniqueCalls.push(query)
                    return existingEmail ? { id: 'existing-id' } : null
                },
                create: async (query) => {
                    state.createCalls.push(query)
                    return { id: 'new-user-id', email: query.data.email }
                },
            },
        },
    }
    const logger = createLogger()
    const processControl = {
        exitCode: undefined,
        exit: (code) => state.exitCalls.push(code),
    }
    const dependencies = {
        argv,
        env: {
            DATABASE_URL,
            BOOTSTRAP_ADMIN_PASSWORD: PASSWORD,
            BOOTSTRAP_CONFIRM_DB_NAME: DATABASE_NAME,
            ...env,
        },
        input,
        prompt,
        logger,
        createDatabase: async (url) => {
            state.createDatabaseCalls.push(url)
            if (createDatabaseError) throw createDatabaseError
            return client
        },
        hasher: async (...args) => {
            state.hashCalls.push(args)
            return hasher(...args)
        },
        lock: async (operation, options) => {
            state.lockCalls += 1
            assert.equal(options.database, client)
            return operation({
                transaction: client.transaction,
                superAdminCount,
            })
        },
    }

    return { client, dependencies, logger, processControl, state }
}

const runCli = async (harness) => runBootstrapCli({
    ...harness.dependencies,
    logger: harness.logger,
    processControl: harness.processControl,
    flushOutput: async () => {},
})

test('bootstrap creates a verified super_admin with a normalized email and app-cost password hash', async () => {
    const harness = createHarness()
    const exitCode = await runCli(harness)

    assert.equal(exitCode, 0)
    assert.equal(harness.processControl.exitCode, 0)
    assert.deepEqual(harness.state.exitCalls, [0])
    assert.deepEqual(harness.state.createDatabaseCalls, [new URL(DATABASE_URL).href])
    assert.equal(harness.state.lockCalls, 1)
    assert.deepEqual(harness.state.hashCalls, [[PASSWORD, BCRYPT_SALT_ROUNDS]])
    assert.deepEqual(harness.state.createCalls[0].data, {
        name: NAME,
        email: NORMALIZED_EMAIL,
        password: `fake-hash:${BCRYPT_SALT_ROUNDS}:${PASSWORD}`,
        role: 'super_admin',
        email_verified: true,
    })
    assert.deepEqual(harness.state.createCalls[0].select, { id: true, email: true })
    assert.equal(harness.state.disconnectCalls, 1)
    const output = JSON.stringify(harness.logger.entries)
    assert.match(output, /host=db\.example\.test database=bootstrap_test/u)
    assert.match(output, /id=new-user-id email=first\.admin@example\.invalid/u)
    assert.match(output, /Remove BOOTSTRAP_ADMIN_PASSWORD and BOOTSTRAP_CONFIRM_DB_NAME/u)
    assert.doesNotMatch(output, new RegExp(PASSWORD, 'u'))
    assert.doesNotMatch(output, new RegExp(`fake-hash:${BCRYPT_SALT_ROUNDS}`, 'u'))
    assert.doesNotMatch(output, new RegExp(DATABASE_URL.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
})

test('TTY password is requested through a hidden prompt and database name is retyped', async () => {
    const promptCalls = []
    const responses = [EMAIL, NAME, DATABASE_NAME, PASSWORD]
    const harness = createHarness({
        argv: [],
        input: { isTTY: true },
        prompt: async (label, options) => {
            promptCalls.push({ label, hidden: options.hidden === true })
            return responses.shift()
        },
        env: { BOOTSTRAP_ADMIN_PASSWORD: 'must-not-be-used-on-tty' },
    })

    await runCli(harness)

    assert.deepEqual(promptCalls, [
        { label: 'Email', hidden: false },
        { label: 'Name', hidden: false },
        { label: 'Retype database name to confirm', hidden: false },
        { label: 'Password', hidden: true },
    ])
    assert.equal(harness.state.hashCalls[0][0], PASSWORD)
})

test('refuses when a super_admin already exists and disconnects without writing', async () => {
    const harness = createHarness({ superAdminCount: 1 })
    const exitCode = await runCli(harness)

    assert.equal(exitCode, 1)
    assert.equal(harness.processControl.exitCode, 1)
    assert.deepEqual(harness.state.exitCalls, [1])
    assert.equal(harness.state.createCalls.length, 0)
    assert.equal(harness.state.findUniqueCalls.length, 0)
    assert.equal(harness.state.disconnectCalls, 1)
    assert.match(JSON.stringify(harness.logger.entries), /A super_admin already exists/u)
})

test('refuses when the email already exists and disconnects without writing', async () => {
    const harness = createHarness({ existingEmail: true })
    const exitCode = await runCli(harness)

    assert.equal(exitCode, 1)
    assert.equal(harness.state.createCalls.length, 0)
    assert.equal(harness.state.disconnectCalls, 1)
    assert.match(JSON.stringify(harness.logger.entries), /Email already exists/u)
})

test('weak and short passwords are refused before creating a Prisma client', async (t) => {
    for (const [label, password] of [
        ['weak', 'alllowercasepassword'],
        ['short', 'Aa1short'],
    ]) {
        await t.test(label, async () => {
            const harness = createHarness({
                env: { BOOTSTRAP_ADMIN_PASSWORD: password },
            })
            const exitCode = await runCli(harness)

            assert.equal(exitCode, 1)
            assert.equal(harness.state.createDatabaseCalls.length, 0)
            assert.deepEqual(harness.state.exitCalls, [1])
            assert.doesNotMatch(JSON.stringify(harness.logger.entries), new RegExp(password, 'u'))
        })
    }
})

test('database confirmation mismatch and missing confirmation refuse before creating Prisma', async (t) => {
    for (const [label, confirmation] of [
        ['mismatch', 'another_database'],
        ['missing', undefined],
    ]) {
        await t.test(label, async () => {
            const harness = createHarness({
                env: { BOOTSTRAP_CONFIRM_DB_NAME: confirmation },
            })
            const exitCode = await runCli(harness)

            assert.equal(exitCode, 1)
            assert.equal(harness.state.createDatabaseCalls.length, 0)
            assert.equal(harness.state.exitCalls[0], 1)
            assert.doesNotMatch(JSON.stringify(harness.logger.entries), /db-user|db-password|postgresql:\/\//u)
        })
    }
})

test('password is never accepted from argv or included in refusal output', async () => {
    const argvPassword = 'DoNotExposeThisPassword123'
    const harness = createHarness({
        argv: [EMAIL, NAME, argvPassword],
    })
    const exitCode = await runCli(harness)

    assert.equal(exitCode, 1)
    assert.equal(harness.state.createDatabaseCalls.length, 0)
    assert.equal(harness.state.hashCalls.length, 0)
    assert.equal(harness.state.disconnectCalls, 0)
    assert.doesNotMatch(JSON.stringify(harness.logger.entries), new RegExp(argvPassword, 'u'))
    assert.doesNotMatch(JSON.stringify(harness.logger.entries), new RegExp(PASSWORD, 'u'))
})

test('database creation errors exit non-zero and raw errors are not logged', async () => {
    const harness = createHarness({
        createDatabaseError: new Error(`query failed with ${PASSWORD}`),
    })
    const exitCode = await runCli(harness)

    assert.equal(exitCode, 1)
    assert.equal(harness.state.disconnectCalls, 0)
    assert.doesNotMatch(JSON.stringify(harness.logger.entries), new RegExp(PASSWORD, 'u'))
})

test('database client is disconnected if disconnect itself fails and CLI exits non-zero', async () => {
    const harness = createHarness({ disconnectError: new Error(PASSWORD) })
    const exitCode = await runCli(harness)

    assert.equal(exitCode, 1)
    assert.equal(harness.state.disconnectCalls, 1)
    assert.doesNotMatch(JSON.stringify(harness.logger.entries), new RegExp(PASSWORD, 'u'))
})
