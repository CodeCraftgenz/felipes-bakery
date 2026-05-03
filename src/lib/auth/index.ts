import NextAuth from 'next-auth'
import { authConfig } from './config'

export const {
  handlers,  // Route handlers: GET, POST
  auth,      // Server-side auth helper
  signIn,    // Programmatic sign in
  signOut,   // Programmatic sign out
} = NextAuth(authConfig)

// ─── Re-exporta RBAC (edge-safe) ─────────────────────────────
export type { UserRole } from './rbac'
export { hasPermission, isAdminRole } from './rbac'
