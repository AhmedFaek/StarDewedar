// Client-side permission map. This only drives navigation/UX — the backend
// enforces the same rules on every API call and is the source of truth.

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CATALOG_MANAGER: 'catalog_manager',
  SALES_SUPPORT_MANAGER: 'sales_support_manager',
}

export const PERMISSIONS = {
  CATALOG_MANAGE: 'catalog:manage',
  PROJECTS_MANAGE: 'projects:manage',
  REQUESTS_MANAGE: 'requests:manage',
  SUPPORT_MANAGE: 'support:manage',
  ANALYTICS_VIEW: 'analytics:view',
  DASHBOARD_VIEW: 'dashboard:view',
  USERS_MANAGE: 'users:manage',
}

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.CATALOG_MANAGER]: [PERMISSIONS.CATALOG_MANAGE],
  [ROLES.SALES_SUPPORT_MANAGER]: [PERMISSIONS.REQUESTS_MANAGE, PERMISSIONS.SUPPORT_MANAGE],
}

export const ADMIN_ROLES = Object.values(ROLES)

export const isAdminRole = (role) => ADMIN_ROLES.includes(role)

export const hasPermission = (role, permission) =>
  Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role) &&
  ROLE_PERMISSIONS[role].includes(permission)

// Permission required for each dashboard path (also used to build the sidebar).
export const ROUTE_PERMISSIONS = {
  '/': PERMISSIONS.DASHBOARD_VIEW,
  '/requests': PERMISSIONS.REQUESTS_MANAGE,
  '/categories': PERMISSIONS.CATALOG_MANAGE,
  '/products': PERMISSIONS.CATALOG_MANAGE,
  '/projects': PERMISSIONS.PROJECTS_MANAGE,
  '/conversations': PERMISSIONS.SUPPORT_MANAGE,
  '/contact-messages': PERMISSIONS.SUPPORT_MANAGE,
  '/users': PERMISSIONS.USERS_MANAGE,
}

export const canAccessPath = (role, path) =>
  hasPermission(role, ROUTE_PERMISSIONS[path])

// First page a role is allowed to see (landing page after login / fallback).
export const getHomePath = (role) =>
  Object.keys(ROUTE_PERMISSIONS).find((path) => canAccessPath(role, path)) || null
