import { ROLES } from './constants.js'

/**
 * Permissions are coarse feature areas of the admin dashboard.
 * Each permission covers reads AND writes (create/update/delete) for that area.
 */
export const PERMISSIONS = {
    CATALOG_MANAGE: 'catalog:manage',     // products + categories
    PROJECTS_MANAGE: 'projects:manage',
    REQUESTS_MANAGE: 'requests:manage',   // BOQ / visit / quotation requests
    SUPPORT_MANAGE: 'support:manage',     // contact messages + conversations
    ANALYTICS_VIEW: 'analytics:view',
    DASHBOARD_VIEW: 'dashboard:view',     // aggregate stats on dashboard home
    USERS_MANAGE: 'users:manage',         // admin user accounts and role assignment
}

const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.CATALOG_MANAGER]: [PERMISSIONS.CATALOG_MANAGE],
    [ROLES.SALES_SUPPORT_MANAGER]: [PERMISSIONS.REQUESTS_MANAGE, PERMISSIONS.SUPPORT_MANAGE],
    // customer (and any unknown role) → no admin permissions
}

/** Returns true only if `role` is a known role that was explicitly granted `permission`. */
export const roleHasPermission = (role, permission) => {
    if (typeof role !== 'string') return false
    const granted = Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)
        ? ROLE_PERMISSIONS[role]
        : []
    return granted.includes(permission)
}
