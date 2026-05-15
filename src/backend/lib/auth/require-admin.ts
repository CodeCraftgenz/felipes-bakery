/**
 * Helper de autorização — restringe acesso a usuários admin.
 *
 * Usar em todas as rotas de /api/admin/* em substituição ao `auth()` direto.
 * Retorna a sessão se o usuário tiver role admin, ou null caso contrário.
 */

import 'server-only'
import { auth } from '@backend/lib/auth'

/**
 * Verifica autenticação E autorização de admin.
 * Retorna a sessão se válida, null caso o usuário não seja admin.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  // adminUser é a flag definida no JWT durante login via admin-credentials
  if (!(session.user as any).adminUser) return null
  return session
}
