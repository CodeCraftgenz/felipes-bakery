// ─── RBAC — Funções Puras (Edge-safe) ────────────────────────
// Sem imports de DB, compatível com Edge Runtime do middleware

export type UserRole = 'admin_master' | 'admin' | 'operador' | 'customer'

const ADMIN_PERMISSIONS: Record<UserRole, string[]> = {
  admin_master: ['*'],
  admin: [
    'products:read',  'products:write',
    'categories:read', 'categories:write',
    'orders:read',    'orders:write',    'orders:status_update',
    'customers:read',
    'analytics:read',
    'reports:read',   'reports:export',
    'coupons:read',   'coupons:write',
    'banners:read',   'banners:write',
    'stock:read',     'stock:write',
    'users:read',
    'settings:read',  'settings:write',
    'audit_logs:read',
    'content:read',   'content:write',
  ],
  operador: [
    'orders:read',    'orders:status_update',
    'stock:read',     'stock:movement',
    'products:read',
  ],
  customer: [],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ADMIN_PERMISSIONS[role] ?? []
  if (perms.includes('*')) return true
  return perms.includes(permission)
}

export function isAdminRole(role: string): role is 'admin_master' | 'admin' | 'operador' {
  return ['admin_master', 'admin', 'operador'].includes(role)
}
