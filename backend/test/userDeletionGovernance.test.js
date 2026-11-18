import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deleteUser } from '../src/modules/users/user.service.js'

const makeState = (users) => new Map(users.map((user) => [user.id, { ...user }]))

const makeDependencies = (users) => {
    const state = makeState(users)
    let lockCalls = 0
    const repository = {
        findUserById: async (id) => state.get(id) || null,
        deleteUserByIdUnlessSuperAdmin: async (id) => {
            const user = state.get(id)
            if (!user || user.role === 'super_admin') return { count: 0 }
            state.delete(id)
            return { count: 1 }
        },
    }
    const lock = async (operation) => {
        lockCalls += 1
        const transaction = {
            user: {
                findUnique: async ({ where }) => {
                    const user = state.get(where.id)
                    return user ? { id: user.id, role: user.role } : null
                },
                delete: async ({ where }) => {
                    const user = state.get(where.id)
                    if (!user) {
                        const error = new Error('Record to delete does not exist')
                        error.code = 'P2025'
                        throw error
                    }
                    state.delete(where.id)
                    return user
                },
            },
        }
        const superAdminCount = [...state.values()]
            .filter((user) => user.role === 'super_admin').length
        return operation({ transaction, superAdminCount })
    }

    return {
        state,
        repository,
        lock,
        get lockCalls() { return lockCalls },
    }
}

const superAdmin = (id) => ({ id, role: 'super_admin' })
const manager = (id, role = 'catalog_manager') => ({ id, role })

test('super_admin can delete another super_admin when at least two exist', async () => {
    const dependencies = makeDependencies([superAdmin('admin-one'), superAdmin('admin-two')])
    const result = await deleteUser(
        'admin-two',
        { userId: 'admin-one', role: 'super_admin' },
        dependencies
    )

    assert.deepEqual(result, { message: 'User deleted successfully.' })
    assert.equal(dependencies.lockCalls, 1)
    assert.equal(dependencies.state.has('admin-two'), false)
    assert.equal([...dependencies.state.values()].filter((user) => user.role === 'super_admin').length, 1)
})

test('only super_admin may delete a super_admin', async () => {
    const dependencies = makeDependencies([superAdmin('admin-target'), manager('catalog-actor')])

    await assert.rejects(
        deleteUser(
            'admin-target',
            { userId: 'catalog-actor', role: 'catalog_manager' },
            dependencies
        ),
        (error) => error.status === 403 && error.code === 'SUPER_ADMIN_DELETE_FORBIDDEN'
    )
    assert.equal(dependencies.lockCalls, 0)
    assert.equal(dependencies.state.has('admin-target'), true)
})

test('the last super_admin cannot be deleted', async () => {
    const dependencies = makeDependencies([superAdmin('only-admin'), manager('catalog-actor')])

    await assert.rejects(
        deleteUser(
            'only-admin',
            { userId: 'catalog-actor', role: 'super_admin' },
            dependencies
        ),
        (error) => error.status === 409 && error.code === 'LAST_SUPER_ADMIN'
    )
    assert.equal(dependencies.lockCalls, 1)
    assert.equal(dependencies.state.has('only-admin'), true)
})

test('self-deletion stays blocked without taking the lock', async () => {
    const dependencies = makeDependencies([superAdmin('self-admin')])

    await assert.rejects(
        deleteUser(
            'self-admin',
            { userId: 'self-admin', role: 'super_admin' },
            dependencies
        ),
        (error) => error.status === 400 && error.code === 'SELF_DELETE_NOT_ALLOWED'
    )
    assert.equal(dependencies.lockCalls, 0)
    assert.equal(dependencies.state.has('self-admin'), true)
})

test('deleting a non-admin bypasses the lock and preserves the existing success response', async () => {
    const dependencies = makeDependencies([superAdmin('admin'), manager('catalog-user')])
    const result = await deleteUser(
        'catalog-user',
        { userId: 'admin', role: 'super_admin' },
        dependencies
    )

    assert.deepEqual(result, { message: 'User deleted successfully.' })
    assert.equal(dependencies.lockCalls, 0)
    assert.equal(dependencies.state.has('catalog-user'), false)
})

test('a concurrent promotion detected by conditional delete is rechecked under the lock', async () => {
    const dependencies = makeDependencies([superAdmin('admin-one'), manager('target')])
    dependencies.repository.deleteUserByIdUnlessSuperAdmin = async () => {
        dependencies.state.get('target').role = 'super_admin'
        dependencies.state.set('admin-two', superAdmin('admin-two'))
        return { count: 0 }
    }

    const result = await deleteUser(
        'target',
        { userId: 'admin-one', role: 'super_admin' },
        dependencies
    )

    assert.deepEqual(result, { message: 'User deleted successfully.' })
    assert.equal(dependencies.lockCalls, 1)
    assert.equal(dependencies.state.has('target'), false)
    assert.equal([...dependencies.state.values()].filter((user) => user.role === 'super_admin').length, 2)
})
