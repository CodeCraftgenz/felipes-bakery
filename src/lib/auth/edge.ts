// ─── Auth Edge-Safe ───────────────────────────────────────────
// Config mínima para o middleware — apenas verifica o JWT
// SEM imports de mysql2 / Node.js built-ins

import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'

// Config somente com callbacks JWT — providers rodam no servidor
const edgeAuthConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  // Providers não são necessários aqui (não fazem sign-in no middleware)
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
