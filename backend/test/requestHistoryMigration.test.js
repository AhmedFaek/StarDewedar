import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import pg from 'pg'

const { Client } = pg
const backendRoot = path.resolve(import.meta.dirname, '..')
const prismaRoot = path.join(backendRoot, 'prisma')
const migrationsRoot = path.join(prismaRoot, 'migrations')
const migrationName = '20261108190000_link_request_history_to_users'
const migrationDir = path.join(migrationsRoot, migrationName)
const migrationLock = path.join(migrationsRoot, 'migration_lock.toml')
const disposableDatabaseUrl = process.env.REQUEST_HISTORY_TEST_DATABASE_URL

test('request history migration leaves legacy rows unlinked and adds nullable user ownership', {
    skip: !disposableDatabaseUrl
        ? 'Set REQUEST_HISTORY_TEST_DATABASE_URL and REQUEST_HISTORY_TEST_DATABASE_DISPOSABLE=true for an explicitly disposable PostgreSQL database.'
        : false,
}, async () => {
    assert.equal(process.env.REQUEST_HISTORY_TEST_DATABASE_DISPOSABLE, 'true')
    assert.ok(existsSync(migrationDir), 'Expected the timestamped request-history migration directory')
    const newestMigration = readdirSync(migrationsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .at(-1)
    assert.ok(migrationName > newestMigration,
        'Request-history migration must sort after the newest existing migration')

    const databaseUrl = new URL(disposableDatabaseUrl)
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))
    assert.doesNotMatch(databaseName, /^(stardewedar_db|stardewedar_managed_copy_9802)$/i)
    assert.match(databaseName, /(test|disposable|integration)/i,
        'Disposable test database name must identify it as a test, disposable, or integration database')

    const client = new Client({ connectionString: disposableDatabaseUrl })
    await client.connect()
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'request-history-migration-'))

    try {
        const currentDatabase = await client.query('SELECT current_database() AS name')
        assert.equal(currentDatabase.rows[0].name, databaseName)
        const existingTables = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename NOT LIKE 'pg_%'
              AND tablename NOT LIKE 'sql_%'
        `)
        assert.deepEqual(existingTables.rows, [],
            'Refusing to run migrations against a database that is not empty')

        const temporaryPrismaRoot = path.join(tempRoot, 'prisma')
        const temporaryMigrationsRoot = path.join(temporaryPrismaRoot, 'migrations')
        mkdirSync(temporaryMigrationsRoot, { recursive: true })
        cpSync(path.join(migrationsRoot, '0_init'), path.join(temporaryMigrationsRoot, '0_init'), {
            recursive: true,
        })
        cpSync(path.join(prismaRoot, 'schema.prisma'), path.join(temporaryPrismaRoot, 'schema.prisma'))
        cpSync(migrationLock, path.join(temporaryMigrationsRoot, 'migration_lock.toml'))
        cpSync(migrationDir, path.join(temporaryMigrationsRoot, migrationName), { recursive: true })

        const configPath = path.join(tempRoot, 'prisma.config.js')
        const prismaConfigModulePath = path.join(backendRoot, 'node_modules', 'prisma', 'config.js')
        writeFileSync(configPath, [
            `const { defineConfig } = require(${JSON.stringify(prismaConfigModulePath)})`,
            '',
            'module.exports = defineConfig({',
            `    schema: ${JSON.stringify(path.join(temporaryPrismaRoot, 'schema.prisma'))},`,
            `    migrations: { path: ${JSON.stringify(temporaryMigrationsRoot)} },`,
            '    datasource: { url: process.env.DATABASE_URL },',
            '})',
            '',
        ].join('\n'))

        const prismaCliPath = path.join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js')
        const deployMigrations = () => {
            const result = spawnSync(process.execPath, [
                prismaCliPath,
                'migrate',
                'deploy',
                '--config',
                configPath,
            ], {
                cwd: backendRoot,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    DATABASE_URL: disposableDatabaseUrl,
                },
            })
            assert.equal(result.status, 0,
                `Prisma migrate deploy failed:\n${result.stdout}\n${result.stderr}`)
        }

        const initOnlyRoot = path.join(tempRoot, 'init-only-migrations')
        mkdirSync(initOnlyRoot, { recursive: true })
        cpSync(path.join(migrationsRoot, '0_init'), path.join(initOnlyRoot, '0_init'), {
            recursive: true,
        })
        cpSync(migrationLock, path.join(initOnlyRoot, 'migration_lock.toml'))
        const initConfigPath = path.join(tempRoot, 'init-only.config.js')
        writeFileSync(initConfigPath, [
            `const { defineConfig } = require(${JSON.stringify(prismaConfigModulePath)})`,
            '',
            'module.exports = defineConfig({',
            `    schema: ${JSON.stringify(path.join(temporaryPrismaRoot, 'schema.prisma'))},`,
            `    migrations: { path: ${JSON.stringify(initOnlyRoot)} },`,
            '    datasource: { url: process.env.DATABASE_URL },',
            '})',
            '',
        ].join('\n'))
        const deployInit = () => {
            const result = spawnSync(process.execPath, [
                prismaCliPath,
                'migrate',
                'deploy',
                '--config',
                initConfigPath,
            ], {
                cwd: backendRoot,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    DATABASE_URL: disposableDatabaseUrl,
                },
            })
            assert.equal(result.status, 0,
                `Initial Prisma migration failed:\n${result.stdout}\n${result.stderr}`)
        }

        deployInit()
        await client.query(`
            INSERT INTO "QuoteRequest"
                ("id", "first_name", "last_name", "phone", "email", "details", "status", "updated_at")
            VALUES ('history-old-quote', 'Old', 'Customer', '+1', 'old-quote@example.invalid',
                    'Legacy quote', 'pending', NOW())
        `)
        await client.query(`
            INSERT INTO "VisitRequest"
                ("id", "factory_name", "factory_activity", "name", "phone_number", "email",
                 "address", "preferred_date", "details", "status", "updated_at")
            VALUES ('history-old-visit', 'Factory', 'Production', 'Old Customer', '+1',
                    'old-visit@example.invalid', 'Street', NOW(), 'Legacy visit', 'pending', NOW())
        `)
        await client.query(`
            INSERT INTO "BOQRequest"
                ("id", "name", "company_name", "email", "phone", "project_name",
                 "project_location", "project_type", "boq_file_url", "status", "updated_at")
            VALUES ('history-old-boq', 'Old Customer', 'Company', 'old-boq@example.invalid',
                    '+1', 'Project', 'Location', 'commercial', 'legacy.pdf', 'pending', NOW())
        `)

        deployMigrations()

        const legacyRows = await client.query(`
            SELECT "id", "user_id" FROM "QuoteRequest" WHERE "id" = 'history-old-quote'
            UNION ALL
            SELECT "id", "user_id" FROM "VisitRequest" WHERE "id" = 'history-old-visit'
            UNION ALL
            SELECT "id", "user_id" FROM "BOQRequest" WHERE "id" = 'history-old-boq'
            ORDER BY "id"
        `)
        assert.deepEqual(legacyRows.rows, [
            { id: 'history-old-boq', user_id: null },
            { id: 'history-old-quote', user_id: null },
            { id: 'history-old-visit', user_id: null },
        ])

        const indexes = await client.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname IN (
                'QuoteRequest_user_id_idx',
                'VisitRequest_user_id_idx',
                'BOQRequest_user_id_idx'
              )
            ORDER BY indexname
        `)
        assert.deepEqual(indexes.rows.map(({ indexname }) => indexname), [
            'BOQRequest_user_id_idx',
            'QuoteRequest_user_id_idx',
            'VisitRequest_user_id_idx',
        ])

        await client.query(`
            INSERT INTO "User" ("id", "name", "email", "password", "role", "updated_at")
            VALUES ('history-customer', 'Customer', 'history@example.invalid', 'hash', 'customer', NOW())
        `)
        await client.query(`
            UPDATE "QuoteRequest" SET "user_id" = 'history-customer' WHERE "id" = 'history-old-quote';
            UPDATE "VisitRequest" SET "user_id" = 'history-customer' WHERE "id" = 'history-old-visit';
            UPDATE "BOQRequest" SET "user_id" = 'history-customer' WHERE "id" = 'history-old-boq';
        `)
        await client.query(`DELETE FROM "User" WHERE "id" = 'history-customer'`)

        const unlinkedAfterDelete = await client.query(`
            SELECT "id", "user_id" FROM "QuoteRequest" WHERE "id" = 'history-old-quote'
            UNION ALL
            SELECT "id", "user_id" FROM "VisitRequest" WHERE "id" = 'history-old-visit'
            UNION ALL
            SELECT "id", "user_id" FROM "BOQRequest" WHERE "id" = 'history-old-boq'
        `)
        assert.equal(unlinkedAfterDelete.rows.every(({ user_id }) => user_id === null), true)
    } finally {
        await client.end()
        rmSync(tempRoot, { recursive: true, force: true })
    }
})
