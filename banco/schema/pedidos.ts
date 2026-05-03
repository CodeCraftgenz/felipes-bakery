/**
 * Schema: Pedidos, Itens e Histórico de Status
 * (tabelas `orders`, `order_items`, `order_status_history`)
 *
 * Fluxo de status de um pedido:
 *   pending_payment → paid → in_production → ready → out_for_delivery → delivered
 *   (qualquer status) → cancelled
 *
 * Regras importantes:
 *   - Pedido criado como pending_payment (aguardando pagamento)
 *   - Estoque só é baixado quando status muda para 'paid' (via webhook do MP)
 *   - Cancelamento restaura estoque e inicia estorno se payment_status=paid
 *   - Cliente só pode cancelar se status for 'pending_payment' ou 'paid'
 *   - order_items armazena snapshot do produto no momento da compra
 *     (nome e preço fixos, independente de alterações futuras no produto)
 *   - order_status_history é append-only (nunca atualizar, sempre inserir)
 *
 * Ciclo da Felipe's Bakery:
 *   - Pedidos aceitos até quarta-feira à noite
 *   - Entregas na sexta-feira, horário combinado individualmente
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  timestamp,
  date,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { clientes }  from './clientes'
import { produtos }  from './produtos'
import { usuarios }  from './usuarios'

// ─── Tipos de status ──────────────────────────────────────
/** Status possíveis de um pedido */
export type StatusPedido =
  | 'pending_payment'   // aguardando pagamento
  | 'payment_failed'    // pagamento falhou
  | 'paid'              // pago — baixa estoque e inicia produção
  | 'in_production'     // sendo preparado
  | 'ready'             // pronto para entrega
  | 'out_for_delivery'  // saiu para entrega
  | 'delivered'         // entregue com sucesso
  | 'cancelled'         // cancelado

/** Status possíveis do pagamento */
export type StatusPagamento = 'pending' | 'paid' | 'failed' | 'refunded'

// ─── Tabela: orders (pedidos) ─────────────────────────────
export const pedidos = mysqlTable(
  'orders',
  {
    /** Identificador único do pedido */
    id: int('id').autoincrement().primaryKey(),

    /**
     * Cliente que fez o pedido.
     * NULL = guest checkout (compra sem conta cadastrada)
     */
    clienteId: int('customer_id').references(() => clientes.id),

    /**
     * Número do pedido legível pelo humano.
     * Formato: FBK-YYYYMMDD-XXXX (ex: FBK-20260412-0001)
     * Exibido para o cliente no e-mail e na área de pedidos.
     */
    numeroPedido: varchar('order_number', { length: 30 }).notNull().unique(),

    /** Status atual do pedido no fluxo de produção */
    status: mysqlEnum('status', [
      'pending_payment', 'payment_failed', 'paid',
      'in_production', 'ready', 'out_for_delivery',
      'delivered', 'cancelled',
    ]).notNull().default('pending_payment'),

    /** Soma dos itens antes de descontos e frete */
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),

    /** Valor do desconto aplicado pelo cupom */
    valorDesconto: decimal('discount_amount', { precision: 10, scale: 2 })
      .notNull()
      .default('0.00'),

    /** Taxa de entrega (0 para retirada no local) */
    valorFrete: decimal('shipping_amount', { precision: 10, scale: 2 })
      .notNull()
      .default('0.00'),

    /** Valor total do pedido (subtotal - desconto + frete) */
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),

    /**
     * Cupom aplicado ao pedido.
     * NULL se nenhum cupom foi usado.
     */
    cupomId: int('coupon_id'),

    /** Método de pagamento escolhido pelo cliente */
    metodoPagamento: mysqlEnum('payment_method', ['pix', 'credit_card', 'debit_card']),

    /** Status atual do pagamento */
    statusPagamento: mysqlEnum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
      .notNull()
      .default('pending'),

    /** Observações do cliente sobre o pedido */
    observacoes: text('notes'),

    // Endereço de entrega (snapshot — não é FK para customer_addresses)
    // Armazenado diretamente no pedido para preservar endereço mesmo se
    // o cliente alterar ou remover o endereço depois
    entregaNome:        varchar('delivery_name', { length: 255 }),
    entregaLogradouro:  varchar('delivery_street', { length: 255 }),
    entregaNumero:      varchar('delivery_number', { length: 20 }),
    entregaComplemento: varchar('delivery_complement', { length: 100 }),
    entregaBairro:      varchar('delivery_neighborhood', { length: 100 }),
    entregaCidade:      varchar('delivery_city', { length: 100 }),
    entregaEstado:      varchar('delivery_state', { length: 2 }),
    entregaCep:         varchar('delivery_zip', { length: 9 }),

    /**
     * Data estimada de entrega calculada pelo ciclo da loja.
     * Sempre uma sexta-feira para a Felipe's Bakery.
     */
    dataEntrega: date('delivery_date'),

    /** Data de criação do pedido */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    numeroPedidoIdx:    uniqueIndex('orders_order_number_idx').on(tabela.numeroPedido),
    clienteDataIdx:     index('orders_customer_date_idx').on(tabela.clienteId, tabela.criadoEm),
    statusDataIdx:      index('orders_status_date_idx').on(tabela.status, tabela.criadoEm),
    statusPagamentoIdx: index('orders_payment_status_idx').on(tabela.statusPagamento),
    dataIdx:            index('orders_created_at_idx').on(tabela.criadoEm),
    dataEntregaIdx:     index('orders_delivery_date_idx').on(tabela.dataEntrega),
  }),
)

// ─── Tabela: order_items (itens do pedido) ────────────────
export const itensPedido = mysqlTable(
  'order_items',
  {
    /** Identificador único do item */
    id: int('id').autoincrement().primaryKey(),

    /** Pedido ao qual este item pertence */
    pedidoId: int('order_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),

    /**
     * Referência ao produto original.
     * Pode ser NULL se o produto foi deletado (soft delete).
     * Os dados do produto são preservados nos campos abaixo (snapshot).
     */
    produtoId: int('product_id').references(() => produtos.id),

    /**
     * Nome do produto NO MOMENTO DA COMPRA (snapshot).
     * Preservado mesmo se o nome do produto mudar depois.
     */
    nomeProduto: varchar('product_name', { length: 255 }).notNull(),

    /**
     * Preço unitário NO MOMENTO DA COMPRA (snapshot).
     * Não reflete alterações de preço feitas depois da compra.
     */
    precoProduto: decimal('product_price', { precision: 10, scale: 2 }).notNull(),

    /** Slug do produto para links na área do cliente */
    slugProduto: varchar('product_slug', { length: 255 }),

    /** Quantidade deste produto no pedido */
    quantidade: int('quantity').notNull(),

    /** Subtotal do item (precoProduto × quantidade) */
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (tabela) => ({
    pedidoIdx:  index('order_items_order_id_idx').on(tabela.pedidoId),
    produtoIdx: index('order_items_product_id_idx').on(tabela.produtoId),
  }),
)

// ─── Tabela: order_status_history (histórico de status) ───
export const historicoStatusPedido = mysqlTable(
  'order_status_history',
  {
    /** Identificador único do registro de histórico */
    id: int('id').autoincrement().primaryKey(),

    /** Pedido ao qual este histórico pertence */
    pedidoId: int('order_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),

    /** Status registrado neste momento */
    status: mysqlEnum('status', [
      'pending_payment', 'payment_failed', 'paid',
      'in_production', 'ready', 'out_for_delivery',
      'delivered', 'cancelled',
    ]).notNull(),

    /**
     * Nota explicativa sobre a mudança de status.
     * Exemplos: "Pagamento confirmado via Pix", "Pedido cancelado pelo cliente"
     */
    nota: varchar('note', { length: 500 }),

    /**
     * Usuário admin que realizou a mudança.
     * NULL = sistema (webhook do Mercado Pago, ação automática)
     */
    usuarioId: int('user_id').references(() => usuarios.id),

    /** Data e hora do registro — APPEND ONLY, nunca atualizar */
    criadoEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    pedidoIdx: index('order_status_history_order_id_idx').on(tabela.pedidoId),
    dataIdx:   index('order_status_history_created_at_idx').on(tabela.criadoEm),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  /** Cliente que fez o pedido (null = guest) */
  cliente: one(clientes, {
    fields:     [pedidos.clienteId],
    references: [clientes.id],
  }),
  /** Itens do pedido */
  itens: many(itensPedido),
  /** Histórico completo de mudanças de status */
  historico: many(historicoStatusPedido),
  // pagamento definido no schema de pagamentos
}))

export const itensPedidoRelations = relations(itensPedido, ({ one }) => ({
  pedido:  one(pedidos,  { fields: [itensPedido.pedidoId],  references: [pedidos.id] }),
  produto: one(produtos, { fields: [itensPedido.produtoId], references: [produtos.id] }),
}))

export const historicoStatusPedidoRelations = relations(historicoStatusPedido, ({ one }) => ({
  pedido:  one(pedidos,  { fields: [historicoStatusPedido.pedidoId],  references: [pedidos.id] }),
  usuario: one(usuarios, { fields: [historicoStatusPedido.usuarioId], references: [usuarios.id] }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Pedido                  = typeof pedidos.$inferSelect
export type NovoPedido              = typeof pedidos.$inferInsert
export type ItemPedido              = typeof itensPedido.$inferSelect
export type NovoItemPedido          = typeof itensPedido.$inferInsert
export type HistoricoStatusPedido   = typeof historicoStatusPedido.$inferSelect

/** Pedido completo com todos os relacionamentos */
export type PedidoCompleto = Pedido & {
  itens:     ItemPedido[]
  historico: HistoricoStatusPedido[]
  cliente?:  import('./clientes').ClientePublico | null
}
