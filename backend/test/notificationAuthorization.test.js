import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requirePermission } from '../src/middleware/roles.middleware.js'
import { PERMISSIONS, roleHasPermission } from '../src/utils/permissions.js'
import { toAdminRequest, toPublicRequest } from '../src/utils/publicRequestDto.js'

const invoke = (middleware, user) => {
    const response = {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode
            return this
        },
        json(body) {
            this.body = body
            return this
        },
    }
    let nextCalled = false
    middleware({ user }, response, () => { nextCalled = true })
    return { response, nextCalled }
}

test('notification retry is granted only to super admins and sales support managers', () => {
    assert.equal(roleHasPermission('super_admin', PERMISSIONS.NOTIFICATION_RETRY), true)
    assert.equal(roleHasPermission('sales_support_manager', PERMISSIONS.NOTIFICATION_RETRY), true)
    assert.equal(roleHasPermission('catalog_manager', PERMISSIONS.NOTIFICATION_RETRY), false)
    assert.equal(roleHasPermission('customer', PERMISSIONS.NOTIFICATION_RETRY), false)
})

test('retry authorization rejects unauthenticated and unauthorized users', () => {
    const middleware = requirePermission(PERMISSIONS.NOTIFICATION_RETRY)
    const unauthenticated = invoke(middleware, null)
    assert.equal(unauthenticated.response.statusCode, 401)
    assert.equal(unauthenticated.nextCalled, false)

    const catalogManager = invoke(middleware, { role: 'catalog_manager' })
    assert.equal(catalogManager.response.statusCode, 403)
    assert.equal(catalogManager.nextCalled, false)

    const salesSupport = invoke(middleware, { role: 'sales_support_manager' })
    assert.equal(salesSupport.nextCalled, true)
})

test('notification lease tokens and internal metadata are omitted from API DTOs', () => {
    const request = {
        id: 'request-1',
        assets: { internal: true },
        notification_status: 'failed',
        notification_lease_token: 'private-token',
    }

    assert.deepEqual(toPublicRequest(request), { id: 'request-1' })
    assert.deepEqual(toAdminRequest(request), {
        id: 'request-1',
        assets: { internal: true },
        notification_status: 'failed',
    })
})
