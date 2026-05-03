/**
 * Ponto de entrada único do schema do banco de dados — Felipe's Bakery
 *
 * Importar daqui em vez de importar de cada arquivo individualmente.
 * Exemplo: import { produtos, clientes, pedidos } from '@schema'
 *
 * Ordem de export respeita as dependências entre tabelas:
 *   1. Entidades base (sem dependências externas)
 *   2. Entidades que dependem das base
 *   3. Entidades que dependem das anteriores
 */

// ── 1. Entidades base ─────────────────────────────────────
/** Usuários do painel admin */
export * from './usuarios'

/** Clientes do site público */
export * from './clientes'

/** Categorias do cardápio */
export * from './categorias'

// ── 2. Entidades que dependem das base ───────────────────
/** Produtos e imagens de produto */
export * from './produtos'

/** Estoque e movimentações */
export * from './estoque'

/** Cupons de desconto */
export * from './cupons'

// ── 3. Entidades que dependem das anteriores ─────────────
/** Pedidos, itens e histórico de status */
export * from './pedidos'

/**
 * Pagamentos (Mercado Pago).
 * Re-exporta tudo exceto `StatusPagamento` (já exportado por `./pedidos`
 * com tipo mais restrito). Importe `StatusPagamentoMP` quando precisar
 * dos status estendidos do Mercado Pago.
 */
export {
  pagamentos,
  pagamentosRelations,
  type Pagamento,
  type NovoPagamento,
  type StatusPagamento as StatusPagamentoMP,
} from './pagamentos'

// ── 4. Entidades de suporte ───────────────────────────────
/** Analytics — sessões, eventos e page views */
export * from './analytics'

/** Banners, logs de auditoria, configurações, contato, páginas */
export * from './misc'
