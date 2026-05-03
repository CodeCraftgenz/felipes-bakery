import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth }        from '@backend/lib/auth/edge'
import { isAdminRole } from '@backend/lib/auth/rbac'

// ─── Rotas Protegidas ─────────────────────────────────────

/** Rotas que exigem qualquer papel de admin */
const ADMIN_ROUTES = /^\/admin(?!\/login)(\/.*)?$/

/** Rotas que exigem cliente logado */
const CUSTOMER_ROUTES = /^\/minha-conta(\/.*)?$/

/** Rotas que nunca devem ser acessadas por usuários logados */
const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha']

// ─── Middleware Principal ─────────────────────────────────
export default auth(async function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── 1. Protege rotas do admin ────────────────────────
  if (ADMIN_ROUTES.test(pathname)) {
    // Não está logado → redireciona para login do admin
    if (!session?.user) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Está logado como cliente (não admin) → nega acesso
    if (!isAdminRole(session.user.role)) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Operador tentando acessar rotas exclusivas de admin
    if (session.user.role === 'operador') {
      const OPERADOR_BLOCKED = [
        '/admin/usuarios',
        '/admin/configuracoes',
        '/admin/logs',
        '/admin/cupons',
        '/admin/banners',
        '/admin/relatorios',
        '/admin/analytics',
        '/admin/clientes',
      ]
      if (OPERADOR_BLOCKED.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }

    // Tudo ok — adiciona headers de contexto para uso nos layouts
    const response = NextResponse.next()
    response.headers.set('x-user-role', session.user.role)
    response.headers.set('x-user-id', session.user.id)
    return response
  }

  // ── 2. Protege área do cliente ────────────────────────
  if (CUSTOMER_ROUTES.test(pathname)) {
    if (!session?.user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin tentando acessar área do cliente — redireciona para o admin
    if (isAdminRole(session.user.role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
  }

  // ── 3. Redireciona usuário logado para fora das páginas de auth
  if (AUTH_ROUTES.includes(pathname) && session?.user) {
    if (isAdminRole(session.user.role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    return NextResponse.redirect(new URL('/minha-conta', req.url))
  }

  return NextResponse.next()
})

// ─── Matcher: quais rotas o middleware processa ───────────
export const config = {
  matcher: [
    // Processa todas as rotas exceto assets estáticos, auth e healthz
    '/((?!_next/static|_next/image|favicon.ico|images/|api/auth|api/healthz).*)',
  ],
}
