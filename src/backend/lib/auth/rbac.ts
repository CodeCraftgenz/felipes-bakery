/**
 * RBAC — Funções Puras (Edge-safe) — Felipe's Bakery
 *
 * Definições de permissões e helpers de checagem de papel.
 * NÃO importa banco de dados nem código Node-only — pode ser
 * usado tanto no middleware (Edge Runtime) quanto no server.
 */

// ── Tipos ─────────────────────────────────────────────────────
export type PapelUsuario = 'admin_master' | 'admin' | 'operador' | 'customer'

// ── Mapa de permissões por papel ──────────────────────────────
const PERMISSOES_POR_PAPEL: Record<PapelUsuario, string[]> = {
  admin_master: ['*'],
  admin: [
    // Produtos
    'produtos:ler', 'produtos:criar', 'produtos:editar', 'produtos:excluir',
    // Categorias
    'categorias:ler', 'categorias:criar', 'categorias:editar', 'categorias:excluir',
    // Pedidos
    'pedidos:ler', 'pedidos:editar', 'pedidos:atualizar_status',
    // Clientes
    'clientes:ler',
    // Analytics e relatórios
    'analytics:ler', 'relatorios:ler', 'relatorios:exportar',
    // Cupons
    'cupons:ler', 'cupons:criar', 'cupons:editar', 'cupons:excluir',
    // Banners e conteúdo
    'banners:ler', 'banners:criar', 'banners:editar', 'banners:excluir',
    'conteudo:ler', 'conteudo:editar',
    // Estoque
    'estoque:ler', 'estoque:movimentar',
    // Usuários (somente leitura)
    'usuarios:ler',
    // Configurações
    'configuracoes:ler',
    // Logs
    'logs:ler',
  ],
  operador: [
    'pedidos:ler', 'pedidos:atualizar_status',
    'estoque:ler', 'estoque:movimentar',
    'produtos:ler',
  ],
  customer: [],
}

/**
 * Verifica se um papel possui uma permissão específica.
 */
export function temPermissao(papel: PapelUsuario, permissao: string): boolean {
  const permissoes = PERMISSOES_POR_PAPEL[papel] ?? []
  if (permissoes.includes('*')) return true
  return permissoes.includes(permissao)
}

/**
 * Verifica se um papel é de administrador (tem acesso ao painel admin).
 */
export function ehPapelAdmin(papel: string): papel is 'admin_master' | 'admin' | 'operador' {
  return ['admin_master', 'admin', 'operador'].includes(papel)
}

// ── Aliases em inglês (compatibilidade) ───────────────────────
export type UserRole         = PapelUsuario
export const hasPermission   = temPermissao
export const isAdminRole     = ehPapelAdmin
