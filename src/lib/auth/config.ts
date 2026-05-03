import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db, customers, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// ─── Schema de validação do login ─────────────────────────
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

// ─── Configuração NextAuth v5 ─────────────────────────────
export const authConfig: NextAuthConfig = {
  // Não usar database adapter — gerenciamos sessões via JWT
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60, // 7 dias para clientes
  },

  pages: {
    signIn:  '/login',       // Página de login do cliente
    error:   '/login',       // Redireciona erros para /login
  },

  providers: [
    // ── Google OAuth (clientes do site) ─────────────────
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id:    profile.sub,
          name:  profile.name,
          email: profile.email,
          image: profile.picture,
          role:  'customer' as const,
        }
      },
    }),

    // ── Credentials — Clientes do site ──────────────────
    Credentials({
      id:   'customer-credentials',
      name: 'Customer Credentials',
      credentials: {
        email:    { label: 'E-mail',  type: 'email' },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.email, email))
          .limit(1)

        if (!customer || !customer.passwordHash) return null
        if (!customer.isActive) return null
        if (customer.deletedAt) return null

        const isValid = await bcrypt.compare(password, customer.passwordHash)
        if (!isValid) return null

        return {
          id:    String(customer.id),
          email: customer.email,
          name:  customer.name,
          image: customer.avatarUrl ?? undefined,
          role:  'customer' as const,
        }
      },
    }),

    // ── Credentials — Admin ─────────────────────────────
    // Rota de login separada: /admin/login
    Credentials({
      id:   'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        email:    { label: 'E-mail', type: 'email' },
        password: { label: 'Senha',  type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) return null
        if (!user.isActive) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        // Atualiza last_login_at
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id))

        return {
          id:        String(user.id),
          email:     user.email,
          name:      user.name,
          role:      user.role as 'admin_master' | 'admin' | 'operador',
          adminUser: true,
        }
      },
    }),
  ],

  callbacks: {
    // ── JWT — adiciona role e tipo de usuário ao token ──
    async jwt({ token, user, account }) {
      if (user) {
        token.id        = user.id
        token.role      = (user as any).role ?? 'customer'
        token.adminUser = (user as any).adminUser ?? false
      }

      // Google OAuth: cria ou encontra customer
      if (account?.provider === 'google' && token.email) {
        const [existing] = await db
          .select({ id: customers.id, name: customers.name })
          .from(customers)
          .where(eq(customers.email, token.email))
          .limit(1)

        if (!existing) {
          const [result] = await db.insert(customers).values({
            email:         token.email,
            name:          token.name ?? 'Cliente',
            googleId:      token.sub,
            avatarUrl:     token.picture as string | undefined,
            emailVerified: 1,
            isActive:      1,
          })
          token.id   = String((result as any).insertId)
          token.role = 'customer'
        } else {
          token.id   = String(existing.id)
          token.role = 'customer'
        }
      }

      return token
    },

    // ── Session — expõe dados ao cliente ────────────────
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id as string
        session.user.role      = token.role as string
        session.user.adminUser = token.adminUser as boolean
      }
      return session
    },

    // ── Authorized — controla acesso a rotas protegidas ─
    // A lógica principal está no middleware.ts
    async authorized({ auth }) {
      return !!auth
    },
  },
}
