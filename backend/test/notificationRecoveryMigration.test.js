import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
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
const migrationName = '20261031144316_notification_recovery_state'
const migrationDir = path.join(migrationsRoot, migrationName)
const migrationLock = path.join(migrationsRoot, 'migration_lock.toml')
const disposableDatabaseUrl = process.env.NOTIFICATION_TEST_DATABASE_URL

test('notification migration marks legacy delivery unknown and adds lease-token columns', {
    skip: !disposableDatabaseUrl
        ? 'Set NOTIFICATION_TEST_DATABASE_URL and NOTIFICATION_TEST_DATABASE_DISPOSABLE=true for an explicitly disposable PostgreSQL database.'
        : false,
}, async () => {
    assert.equal(process.env.NOTIFICATION_TEST_DATABASE_DISPOSABLE, 'true')
    assert.ok(existsSync(migrationDir), 'Expected the timestamped notification migration directory')

    const databaseUrl = new URL(disposableDatabaseUrl)
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))
    assert.doesNotMatch(databaseName, /^(stardewedar_db|stardewedar_managed_copy_9802)$/i)
    assert.match(databaseName, /(test|disposable|integration)/i,
        'Disposable test database name must identify it as a test, disposable, or integration database')

    const client = new Client({ connectionString: disposableDatabaseUrl })
    await client.connect()
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'notification-migration-'))

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

        deployMigrations()
        await client.query(`
            INSERT INTO "VisitRequest"
                ("id", "factory_name", "factory_activity", "name", "phone_number", "email",
                 "address", "preferred_date", "details", "status", "updated_at")
            VALUES
                ('notification-legacy-visit', 'Factory', 'Production', 'Customer', '+1',
                 'visit@example.invalid', 'Street', NOW(), 'Visit', 'pending', NOW()),
                ('notification-failed-visit', 'Factory', 'Production', 'Customer', '+1',
                 'failed@example.invalid', 'Street', NOW(), 'Visit', 'pending', NOW())
        `)
        await client.query(`
            UPDATE "VisitRequest"
            SET "notification_status" = 'failed',
                "notification_attempts" = 1,
                "notification_error_code" = 'EAUTH',
                "notification_last_attempt_at" = NOW()
            WHERE "id" = 'notification-failed-visit'
        `)
        await client.query(`
            INSERT INTO "QuoteRequest"
                ("id", "first_name", "last_name", "phone", "email", "details", "status", "updated_at")
            VALUES ('notification-legacy-quote', 'Test', 'Customer', '+1',
                    'quote@example.invalid', 'Quote', 'pending', NOW())
        `)
        await client.query(`
            INSERT INTO "BOQRequest"
                ("id", "name", "company_name", "email", "phone", "project_name",
                 "project_location", "project_type", "boq_file_url", "status", "updated_at")
            VALUES ('notification-legacy-boq', 'Customer', 'Company', 'boq@example.invalid',
                    '+1', 'Project', 'Location', 'commercial', 'https://files.example.invalid/boq.pdf',
                    'pending', NOW())
        `)

        cpSync(migrationDir, path.join(temporaryMigrationsRoot, migrationName), { recursive: true })
        deployMigrations()

        const states = await client.query(`
            SELECT "id", "notification_status", "notification_attempts",
                   "notification_error_code", "notification_lease_token"
            FROM "VisitRequest"
            UNION ALL
            SELECT "id", "notification_status", "notification_attempts",
                   "notification_error_code", "notification_lease_token"
            FROM "QuoteRequest"
            UNION ALL
            SELECT "id", "notification_status", "notification_attempts",
                   "notification_error_code", "notification_lease_token"
            FROM "BOQRequest"
            ORDER BY "id"
        `)
        assert.deepEqual(states.rows.map(({ id, notification_status, notification_attempts, notification_error_code, notification_lease_token }) => ({
            id,
            status: notification_status,
            attempts: notification_attempts,
            errorCode: notification_error_code,
            leaseToken: notification_lease_token,
        })), [
            {
                id: 'notification-failed-visit',
                status: 'failed',
                attempts: 1,
                errorCode: 'EAUTH',
                leaseToken: null,
            },
            {
                id: 'notification-legacy-boq',
                status: 'unknown',
                attempts: 0,
                errorCode: null,
                leaseToken: null,
            },
            {
                id: 'notification-legacy-quote',
                status: 'unknown',
                attempts: 0,
                errorCode: null,
                leaseToken: null,
            },
            {
                id: 'notification-legacy-visit',
                status: 'unknown',
                attempts: 0,
                errorCode: null,
                leaseToken: null,
            },
        ])
    } finally {
        await client.end()
        try {
            rmSync(tempRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
        } catch (error) {
            if (process.platform !== 'win32' || error.code !== 'EPERM') throw error
            const cleanup = spawnSync('powershell.exe', [
                '-NoProfile',
                '-Command',
                '$ErrorActionPreference = "Stop"; Remove-Item -LiteralPath $env:NOTIFICATION_TEMP_ROOT -Recurse -Force',
            ], {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    NOTIFICATION_TEMP_ROOT: tempRoot,
                },
            })
            assert.equal(cleanup.status, 0,
                `Failed to remove migration-test temporary files:\n${cleanup.stderr}`)
        }
        assert.equal(existsSync(tempRoot), false, 'Migration-test temporary files were not removed')
    }
})
