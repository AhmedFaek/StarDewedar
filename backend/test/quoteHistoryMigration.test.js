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
const migrationName = readdirSync(migrationsRoot)
    .find((name) => /^\d+_preserve_quote_history$/.test(name))
const migrationDir = migrationName ? path.join(migrationsRoot, migrationName) : null
const migrationLock = path.join(migrationsRoot, 'migration_lock.toml')
const disposableDatabaseUrl = process.env.QUOTE_HISTORY_TEST_DATABASE_URL

test('Quote history migration backfills snapshots and preserves requests on Product deletion', {
    skip: !disposableDatabaseUrl
        ? 'Set QUOTE_HISTORY_TEST_DATABASE_URL and QUOTE_HISTORY_TEST_DATABASE_DISPOSABLE=true for an explicitly disposable PostgreSQL database.'
        : false,
}, async () => {
    assert.equal(process.env.QUOTE_HISTORY_TEST_DATABASE_DISPOSABLE, 'true')
    assert.ok(migrationDir, 'Expected the timestamped Quote history migration directory')

    const databaseUrl = new URL(disposableDatabaseUrl)
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))
    assert.doesNotMatch(databaseName, /^(stardewedar_db|stardewedar_managed_copy_9802)$/i)
    assert.match(databaseName, /(test|disposable|integration)/i,
        'Disposable test database name must identify it as a test, disposable, or integration database')

    const client = new Client({ connectionString: disposableDatabaseUrl })
    await client.connect()
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'quote-history-migration-'))

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
            INSERT INTO "Category" ("id", "name_en", "name_ar", "type", "updated_at")
            VALUES ('quote-history-category', 'Category', 'فئة', 'product', NOW())
        `)
        await client.query(`
            INSERT INTO "Product" ("id", "name_en", "name_ar", "category_id", "updated_at")
            VALUES ('quote-history-product', 'Original English', 'الاسم الأصلي',
                    'quote-history-category', NOW())
        `)
        await client.query(`
            INSERT INTO "QuoteRequest"
                ("id", "first_name", "last_name", "phone", "email", "product_id",
                 "details", "status", "updated_at")
            VALUES ('quote-history-linked', 'Test', 'Customer', '+12345678901',
                    'linked@example.invalid', 'quote-history-product',
                    'Historical linked quote', 'pending', NOW())
        `)
        await client.query(`
            INSERT INTO "QuoteRequest"
                ("id", "first_name", "last_name", "phone", "email",
                 "custom_product_name", "details", "status", "updated_at")
            VALUES ('quote-history-unlinked', 'Test', 'Customer', '+12345678901',
                    'unlinked@example.invalid', 'Custom item',
                    'Historical unlinked quote', 'pending', NOW())
        `)

        cpSync(migrationDir, path.join(temporaryMigrationsRoot, migrationName), {
            recursive: true,
        })
        deployMigrations()

        const backfilled = await client.query(`
            SELECT "product_id", "product_name_en_snapshot", "product_name_ar_snapshot"
            FROM "QuoteRequest"
            WHERE "id" = 'quote-history-linked'
        `)
        assert.deepEqual(backfilled.rows[0], {
            product_id: 'quote-history-product',
            product_name_en_snapshot: 'Original English',
            product_name_ar_snapshot: 'الاسم الأصلي',
        })

        const unlinked = await client.query(`
            SELECT "product_id", "product_name_en_snapshot", "product_name_ar_snapshot",
                   "custom_product_name"
            FROM "QuoteRequest"
            WHERE "id" = 'quote-history-unlinked'
        `)
        assert.deepEqual(unlinked.rows[0], {
            product_id: null,
            product_name_en_snapshot: null,
            product_name_ar_snapshot: null,
            custom_product_name: 'Custom item',
        })

        await client.query(`
            UPDATE "Product"
            SET "name_en" = 'Renamed English', "name_ar" = 'اسم جديد'
            WHERE "id" = 'quote-history-product'
        `)
        const afterRename = await client.query(`
            SELECT "product_name_en_snapshot", "product_name_ar_snapshot"
            FROM "QuoteRequest"
            WHERE "id" = 'quote-history-linked'
        `)
        assert.deepEqual(afterRename.rows[0], {
            product_name_en_snapshot: 'Original English',
            product_name_ar_snapshot: 'الاسم الأصلي',
        })

        await client.query('DELETE FROM "Product" WHERE "id" = $1', ['quote-history-product'])
        const afterDelete = await client.query(`
            SELECT "product_id", "product_name_en_snapshot", "product_name_ar_snapshot"
            FROM "QuoteRequest"
            WHERE "id" = 'quote-history-linked'
        `)
        assert.deepEqual(afterDelete.rows[0], {
            product_id: null,
            product_name_en_snapshot: 'Original English',
            product_name_ar_snapshot: 'الاسم الأصلي',
        })
    } finally {
        await client.end()
        try {
            rmSync(tempRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
        } catch (error) {
            if (process.platform !== 'win32' || error.code !== 'EPERM') throw error
            const cleanup = spawnSync('powershell.exe', [
                '-NoProfile',
                '-Command',
                '$ErrorActionPreference = "Stop"; Remove-Item -LiteralPath $env:QUOTE_HISTORY_TEMP_ROOT -Recurse -Force',
            ], {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    QUOTE_HISTORY_TEMP_ROOT: tempRoot,
                },
            })
            assert.equal(cleanup.status, 0,
                `Failed to remove migration-test temporary files:\n${cleanup.stderr}`)
        }
        assert.equal(existsSync(tempRoot), false, 'Migration-test temporary files were not removed')
    }
})
