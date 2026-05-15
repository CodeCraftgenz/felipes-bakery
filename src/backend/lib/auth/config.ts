/**
 * Configuração do NextAuth v5 — Felipe's Bakery
 *
 * Define os provedores de autenticação e os callbacks de sessão/JWT.
 * Suporta dois contextos diferentes de login:
 *
 *   1. Clientes do site (customer-credentials, google)
 *      → sessão de 7 dias com renovação por atividade
 *      → redireciona para /login em caso de sessão expirada
 *
 *   2. Administradores do painel (admin-credentials)
 *      → sessão de 8 horas SEM renovação automática
 *      → redireciona para /admin/login em caso de sessão expirada
 *
 * Segurança:
 *   - Senhas verificadas com bcrypt (custo 12)
 *   - Tokens JWT assinados com NEXTAUTH_SECRET (256 bits)
 *   - Usuário inativo ou excluído não consegue logar
 *   - last_login_at atualizado a cada login do admin
 */

import type { NextAuthConfig } from 'next-auth'
import Credentials             from 'next-auth/providers/credentials'
import Google                  from 'next-auth/providers/google'
import bcrypt                  from 'bcryptjs'
import { eq }                  from 'drizzle-orm'
import { z }                   from 'zod'
import { db, clientes, usuarios } from '../banco'

// ── Schema de validação dos campos de login ───────────────
const schemaLogin = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// ── Configuração principal do NextAuth ────────────────────
export const authConfig: NextAuthConfig = {
  /**
   * Estratégia JWT — não armazena sessões no banco.
   * Reduz queries e simplifica o deploy.
   */
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60, // 7 dias para clientes
  },

  /**
   * Páginas customizadas de autenticação.
   * O admin tem sua própria página de login em /admin/login.
   */
  pages: {
    signIn: '/login',
    error:  '/login',
  },

  // Confia no host injetado pela infra (Hostinger Node.js Web App, Nginx
  // proxy reverso, etc.). Sem isso o NextAuth lança UntrustedHost no edge
  // runtime e nas API routes em produção.
  trustHost: true,

  providers: [
    // ── Google OAuth (clientes do site) ───────────────────
    // Só registra o provider quando as credenciais OAuth estão definidas.
    // Em ambientes sem Google configurado (ex: deploy inicial na Hostinger
    // antes de configurar OAuth), evita que o NextAuth derrube a aplicação
    // na inicialização por causa de clientId/clientSecret indefinidos.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            profile(perfil) {
              return {
                id:    perfil.sub,
                name:  perfil.name,
                email: perfil.email,
                image: perfil.picture,
                role:  'customer' as const,
              }
            },
          }),
        ]
      : []),

    // ── Credenciais — Clientes do site ────────────────────
    Credentials({
      id:   'customer-credentials',
      name: 'Cliente — E-mail e Senha',
      credentials: {
        email:    { label: 'E-mail',  type: 'email' },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credenciais) {
        // Valida os campos recebidos
        const resultado = schemaLogin.safeParse(credenciais)
        if (!resultado.success) return null

        const { email, password } = resultado.data

        // Busca o cliente pelo e-mail
        const [cliente] = await db
          .select()
          .from(clientes)
          .where(eq(clientes.email, email))
          .limit(1)

        // Verifica se o cliente existe e tem senha cadastrada
        if (!cliente || !cliente.senhaHash) return null

        // Verifica se a conta está ativa e não foi excluída
        if (!cliente.ativo || cliente.excluidoEm) return null

        // Compara a senha com o hash armazenado
        const senhaCorreta = await bcrypt.compare(password, cliente.senhaHash)
        if (!senhaCorreta) return null

        return {
          id:    String(cliente.id),
          email: cliente.email,
          name:  cliente.nome,
          image: cliente.urlAvatar ?? undefined,
          role:  'customer' as const,
        }
      },
    }),

    // ── Credenciais — Administradores do painel ───────────
    // Usa id diferente para distinguir no JWT qual contexto logou
    Credentials({
      id:   'admin-credentials',
      name: 'Administrador — E-mail e Senha',
      credentials: {
        email:    { label: 'E-mail', type: 'email' },
        password: { label: 'Senha',  type: 'password' },
      },
      async authorize(credenciais) {
        const resultado = schemaLogin.safeParse(credenciais)
        if (!resultado.success) return null

        const { email, password } = resultado.data

        // Busca o usuário admin pelo e-mail
        const [usuario] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, email))
          .limit(1)

        if (!usuario || !usuario.ativo) return null

        const senhaCorreta = await bcrypt.compare(password, usuario.senhaHash)
        if (!senhaCorreta) return null

        // Registra o horário do último login
        await db
          .update(usuarios)
          .set({ ultimoLoginEm: new Date() })
          .where(eq(usuarios.id, usuario.id))

        return {
          id:        String(usuario.id),
          email:     usuario.email,
          name:      usuario.nome,
          role:      usuario.papel as 'admin_master' | 'admin' | 'operador',
          adminUser: true, // flag que diferencia admin de cliente no JWT
        }
      },
    }),
  ],

  callbacks: {
    /**
     * JWT — chamado ao criar/atualizar o token.
     * Adiciona role e adminUser ao token para uso no middleware.
     */
    async jwt({ token, user, account }) {
      // Na primeira autenticação (user existe), persiste dados no token
      if (user) {
        token.id        = user.id
        token.role      = (user as any).role ?? 'customer'
        token.adminUser = (user as any).adminUser ?? false
        // Admin: sessão expira em 8 horas (cliente usa o maxAge padrão de 7 dias)
        if ((user as any).adminUser) {
          token.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60
        }
      }

      // Google OAuth: cria ou recupera o cliente no banco
      if (account?.provider === 'google' && token.email) {
        const [existente] = await db
          .select({ id: clientes.id })
          .from(clientes)
          .where(eq(clientes.email, token.email))
          .limit(1)

        if (!existente) {
          // Primeiro login com Google — cria a conta do cliente
          const [inserido] = await db.insert(clientes).values({
            email:           token.email,
            nome:            token.name ?? 'Cliente',
            googleId:        token.sub,
            urlAvatar:       token.picture as string | undefined,
            emailVerificado: 1,
            ativo:           1,
          })
          token.id   = String((inserido as any).insertId)
          token.role = 'customer'
        } else {
          token.id   = String(existente.id)
          token.role = 'customer'
        }
      }

      return token
    },

    /**
     * Session — formata o objeto de sessão exposto para o frontend.
     * Nunca expor dados sensíveis (senha, tokens internos).
     */
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id as string
        session.user.role      = token.role as string
        session.user.adminUser = token.adminUser as boolean
      }
      return session
    },
  },
}
