/**
 * Auth Edge-Safe — Felipe's Bakery
 *
 * Configuração mínima do NextAuth para uso no middleware (Edge Runtime).
 * NÃO importa mysql2 nem providers que dependam de Node.js — apenas
 * verifica e enriquece o JWT.
 *
 * Use esta variante somente em `src/middleware.ts`.
 * Para Server Components, Route Handlers e Actions, importe de:
 *   import { auth } from '@backend/lib/auth'
 */

import NextAuth                  from 'next-auth'
import type { NextAuthConfig }   from 'next-auth'

const edgeAuthConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60, // 7 dias
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  // Sem providers — middleware só lê o JWT já existente
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id        = user.id
        token.role      = (user as any).role ?? 'customer'
        token.adminUser = (user as any).adminUser ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id as string
        session.user.role      = token.role as string
        session.user.adminUser = token.adminUser as boolean
      }
      return session
    },
    async authorized({ auth }) {
      return !!auth
    },
  },
}

export const { auth } = NextAuth(edgeAuthConfig)
