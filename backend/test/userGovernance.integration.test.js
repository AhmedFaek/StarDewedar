import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const disposableDatabaseUrl = process.env.USER_GOVERNANCE_TEST_DATABASE_URL

test('super-admin advisory lock serializes concurrent deletes and bypasses non-admin deletes', {
    skip: !disposableDatabaseUrl
        ? 'Set USER_GOVERNANCE_TEST_DATABASE_URL and USER_GOVERNANCE_TEST_DATABASE_DISPOSABLE=true for an explicitly disposable PostgreSQL database.'
        : false,
}, async () => {
    assert.equal(process.env.USER_GOVERNANCE_TEST_DATABASE_DISPOSABLE, 'true')

    const databaseUrl = new URL(disposableDatabaseUrl)
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))
    assert.doesNotMatch(databaseName, /^(stardewedar_db|stardewedar_managed_copy_9802)$/i)
    assert.match(databaseName, /(test|disposable|integration)/i,
        'Disposable test database name must identify it as a test, disposable, or integration database')

    const pool = new Pool({ connectionString: disposableDatabaseUrl })
    const database = new PrismaClient({ adapter: new PrismaPg(pool) })
    const suffix = randomUUID()
    const emails = [
        `governance-admin-one-${suffix}@example.invalid`,
        `governance-admin-two-${suffix}@example.invalid`,
        `governance-user-${suffix}@example.invalid`,
    ]
    let createdUserIds = []

    try {
        const currentDatabase = await database.$queryRaw`
            SELECT current_database() AS name
        `
        assert.equal(currentDatabase[0].name, databaseName)

        const existingUsers = await database.user.count()
        assert.equal(existingUsers, 0,
            'Refusing to run governance race tests against a database that already contains users')

        const [{ deleteUser }, { withSuperAdminLock }] = await Promise.all([
            import('../src/modules/users/user.service.js'),
            import('../src/utils/superAdminLock.js'),
        ])

        const createTestUser = (email, role) => database.user.create({
            data: {
                name: 'Governance Integration Test',
                email,
                password: 'integration-test-hash',
                role,
                email_verified: true,
            },
            select: { id: true },
        })

        const firstAdmin = await createTestUser(emails[0], 'super_admin')
        createdUserIds.push(firstAdmin.id)
        const secondAdmin = await createTestUser(emails[1], 'super_admin')
        createdUserIds.push(secondAdmin.id)
        const nonAdmin = await createTestUser(emails[2], 'catalog_manager')
        createdUserIds.push(nonAdmin.id)

        const repository = {
            findUserById: (id) => database.user.findUnique({
                where: { id },
                select: { id: true, role: true },
            }),
            deleteUserByIdUnlessSuperAdmin: (id) => database.user.deleteMany({
                where: { id, role: { not: 'super_admin' } },
            }),
        }
        const lock = (operation) => withSuperAdminLock(operation, { database })

        const outcomes = await Promise.allSettled([
            deleteUser(firstAdmin.id, {
                userId: 'another-admin',
                role: 'super_admin',
            }, { repository, lock }),
            deleteUser(secondAdmin.id, {
                userId: 'another-admin',
                role: 'super_admin',
            }, { repository, lock }),
        ])
        assert.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 1)
        assert.equal(outcomes.filter(({ status }) => status === 'rejected').length, 1)
        const rejected = outcomes.find(({ status }) => status === 'rejected')
        assert.equal(rejected.reason.code, 'LAST_SUPER_ADMIN')
        assert.equal(await database.user.count({ where: { role: 'super_admin' } }), 1)

        let nonAdminLockCalls = 0
        const observedLock = async (operation) => {
            nonAdminLockCalls += 1
            return lock(operation)
        }
        const nonAdminResult = await deleteUser(nonAdmin.id, {
            userId: 'remaining-admin',
            role: 'super_admin',
        }, { repository, lock: observedLock })
        assert.deepEqual(nonAdminResult, { message: 'User deleted successfully.' })
        assert.equal(nonAdminLockCalls, 0)
    } finally {
        if (createdUserIds.length > 0) {
            await database.user.deleteMany({ where: { id: { in: createdUserIds } } })
        }
        await database.$disconnect()
        await pool.end()
    }
})
