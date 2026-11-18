import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import {
    bootstrapFirstSuperAdmin,
} from '../scripts/create-first-super-admin.js'

const disposableDatabaseUrl = process.env.FIRST_SUPER_ADMIN_TEST_DATABASE_URL

test('first-super-admin bootstrap serializes concurrent calls in PostgreSQL', {
    skip: !disposableDatabaseUrl
        ? 'Set FIRST_SUPER_ADMIN_TEST_DATABASE_URL and FIRST_SUPER_ADMIN_TEST_DATABASE_DISPOSABLE=true for an explicitly disposable PostgreSQL database.'
        : false,
}, async () => {
    assert.equal(process.env.FIRST_SUPER_ADMIN_TEST_DATABASE_DISPOSABLE, 'true')

    const databaseUrl = new URL(disposableDatabaseUrl)
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))
    assert.doesNotMatch(databaseName, /^(stardewedar_db|stardewedar_managed_copy_9802)$/i)
    assert.match(databaseName, /(test|disposable|integration)/i,
        'Disposable test database name must identify it as a test, disposable, or integration database')

    const pool = new Pool({ connectionString: disposableDatabaseUrl })
    const database = new PrismaClient({ adapter: new PrismaPg(pool) })
    const email = `bootstrap-admin-${randomUUID()}@example.invalid`
    let resultIds = []

    try {
        const currentDatabase = await database.$queryRaw`
            SELECT current_database() AS name
        `
        assert.equal(currentDatabase[0].name, databaseName)
        assert.equal(await database.user.count(), 0,
            'Refusing to run bootstrap race test against a database that already contains users')

        const env = {
            DATABASE_URL: disposableDatabaseUrl,
            BOOTSTRAP_ADMIN_PASSWORD: 'IntegrationBootstrapPassword123',
            BOOTSTRAP_CONFIRM_DB_NAME: databaseName,
        }
        const logger = { info() {}, error() {} }
        const calls = [
            bootstrapFirstSuperAdmin({
                argv: [email, 'Bootstrap Integration Admin'],
                env,
                input: { isTTY: false },
                logger,
            }),
            bootstrapFirstSuperAdmin({
                argv: [email, 'Bootstrap Integration Admin'],
                env,
                input: { isTTY: false },
                logger,
            }),
        ]
        const outcomes = await Promise.allSettled(calls)

        assert.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 1)
        assert.equal(outcomes.filter(({ status }) => status === 'rejected').length, 1)
        const succeeded = outcomes.find(({ status }) => status === 'fulfilled')
        resultIds = [succeeded.value.id]
        assert.equal(await database.user.count({ where: { role: 'super_admin' } }), 1)
        assert.equal(await database.user.count({ where: { email } }), 1)
    } finally {
        if (resultIds.length > 0) {
            await database.user.deleteMany({ where: { id: { in: resultIds } } })
        }
        await database.$disconnect()
        await pool.end()
    }
})
