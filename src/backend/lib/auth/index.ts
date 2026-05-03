/**
 * Exportações de Autenticação — Felipe's Bakery
 *
 * Centraliza os handlers do NextAuth e o sistema de permissões (RBAC).
 *
 * Uso em Server Components, Route Handlers e Server Actions:
 *   import { auth } from '@backend/lib/auth'
 *   const sessao = await auth()
 *
 * No middleware (Edge Runtime), use a variante leve:
 *   import { auth } from '@backend/lib/auth/edge'
 */

import NextAuth from 'next-auth'
import { authConfig } from './config'

/**
 * Handlers do NextAuth — exportados para o Route Handler em:
 * src/app/api/auth/[...nextauth]/route.ts
 *
 * - handlers → { GET, POST } para o Route Handler
 * - auth     → helper de autenticação server-side
 * - signIn   → login programático
 * - signOut  → logout programático
 */
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig)

// ── Re-exporta RBAC (edge-safe) ───────────────────────────────
export {
  temPermissao,
  ehPapelAdmin,
  hasPermission,
  isAdminRole,
} from './rbac'

export type { PapelUsuario, UserRole } from './rbac'
