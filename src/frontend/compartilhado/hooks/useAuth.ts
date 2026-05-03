/**
 * Hook useAuth — Felipe's Bakery
 *
 * Abstração do useSession do NextAuth para facilitar o uso nos componentes.
 * Retorna informações da sessão com tipagem completa.
 *
 * Uso:
 *   const { usuario, carregando, estaLogado, ehAdmin } = useAuth()
 */

'use client'

import { useSession } from 'next-auth/react'

// ── Hook ──────────────────────────────────────────────────────
export function useAuth() {
  const { data: sessao, status } = useSession()

  const carregando  = status === 'loading'
  const estaLogado  = status === 'authenticated'
  const usuario     = sessao?.user ?? null

  // Verifica se o usuário tem papel administrativo
  const papel      = (usuario as any)?.role as string | undefined
  const ehAdmin    = papel === 'admin_master' || papel === 'admin'
  const ehOperador = papel === 'operador'
  const ehCliente  = papel === 'customer' || (!ehAdmin && !ehOperador && estaLogado)

  return {
    /** Dados do usuário logado (null se não autenticado) */
    usuario,
    /** true enquanto a sessão está sendo carregada */
    carregando,
    /** true se o usuário está autenticado */
    estaLogado,
    /** true se o usuário tem papel admin ou admin_master */
    ehAdmin,
    /** true se o usuário tem papel operador */
    ehOperador,
    /** true se o usuário tem papel customer */
    ehCliente,
    /** Papel do usuário (admin_master, admin, operador, customer) */
    papel,
  }
}
