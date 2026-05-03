/**
 * Schema: Pagamentos (tabela `payments`)
 *
 * Armazena os dados de pagamento processados pelo Mercado Pago.
 * Relação 1:1 com pedidos — cada pedido tem no máximo um pagamento.
 *
 * Fluxo de pagamento via Pix:
 *   1. Cliente escolhe Pix no checkout
 *   2. Sistema chama API do Mercado Pago e recebe QR Code
 *   3. Cliente escaneia e paga no app do banco
 *   4. Mercado Pago envia webhook para /api/pagamentos/webhook
 *   5. Sistema confirma pagamento → pedido vai para 'paid'
 *
 * Fluxo via cartão:
 *   1. Cliente preenche dados do cartão no frontend (via SDK do MP)
 *   2. Frontend recebe token do cartão do MP
 *   3. Token é enviado para /api/checkout
 *   4. Backend processa o pagamento via API do MP
 *   5. Resultado imediato → pedido vai para 'paid' ou 'payment_failed'
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { pedidos }   from './pedidos'

// ─── Tabela: payments (pagamentos) ────────────────────────
export const pagamentos = mysqlTable(
  'payments',
  {
    /** Identificador único do pagamento */
    id: int('id').autoincrement().primaryKey(),

    /** Pedido ao qual este pagamento pertence (1:1) */
    pedidoId: int('order_id')
      .notNull()
      .unique()
      .references(() => pedidos.id, { onDelete: 'cascade' }),

    /** Provedor de pagamento — por ora apenas Mercado Pago */
    provedor: mysqlEnum('provider', ['mercadopago']).notNull().default('mercadopago'),

    /**
     * ID do pagamento gerado pelo Mercado Pago.
     * Usado para consultar status e processar estornos.
     */
    idProvedorPagamento: varchar('provider_payment_id', { length: 255 }),

    /** Método de pagamento utilizado */
    metodo: mysqlEnum('method', ['pix', 'credit_card', 'debit_card']).notNull(),

    /** Status atual do pagamento */
    status: mysqlEnum('status', [
      'pending',    // aguardando
      'paid',       // pago com sucesso
      'failed',     // falhou
      'refunded',   // estornado
      'in_process', // em processamento (cartão)
      'cancelled',  // cancelado
    ]).notNull().default('pending'),

    /** Valor total do pagamento em Reais */
    valor: decimal('amount', { precision: 10, scale: 2 }).notNull(),

    // ── Dados do Pix ──────────────────────────────────────
    /** QR Code em base64 para exibir ao cliente */
    pixQrCode: text('pix_qr_code'),

    /** Código "copia e cola" do Pix (texto puro) */
    pixCopiaCola: text('pix_qr_code_text'),

    /**
     * Data/hora de expiração do QR Code Pix.
     * Por padrão, o MP expira em 30 minutos.
     */
    pixExpiracao: timestamp('pix_expiration'),

    // ── Dados do Cartão ───────────────────────────────────
    /** Últimos 4 dígitos do cartão (para exibição) */
    cartaoUltimos4: varchar('card_last_four', { length: 4 }),

    /** Bandeira do cartão (Visa, Mastercard, etc.) */
    cartaoBandeira: varchar('card_brand', { length: 20 }),

    // ── Timestamps de status ──────────────────────────────
    /** Data/hora em que o pagamento foi confirmado */
    pagoEm: timestamp('paid_at'),

    /** Data/hora em que o pagamento falhou */
    falhouEm: timestamp('failed_at'),

    /** Data/hora em que o estorno foi processado */
    estornadoEm: timestamp('refunded_at'),

    /**
     * Payload raw recebido do webhook do Mercado Pago.
     * Armazenado para auditoria e reprocessamento se necessário.
     */
    payloadWebhook: text('webhook_payload'),

    /** Data de criação do registro */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    pedidoIdx:           uniqueIndex('payments_order_id_idx').on(tabela.pedidoId),
    idProvedorIdx:       index('payments_provider_id_idx').on(tabela.idProvedorPagamento),
    statusIdx:           index('payments_status_idx').on(tabela.status),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  /** Pedido ao qual este pagamento pertence */
  pedido: one(pedidos, {
    fields:     [pagamentos.pedidoId],
    references: [pedidos.id],
  }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Pagamento      = typeof pagamentos.$inferSelect
export type NovoPagamento  = typeof pagamentos.$inferInsert
export type StatusPagamento = 'pending' | 'paid' | 'failed' | 'refunded' | 'in_process' | 'cancelled'
