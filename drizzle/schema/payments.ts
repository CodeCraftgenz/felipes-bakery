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
import { orders } from './orders'

// ─── Tabela: payments ─────────────────────────────────────
// Relação 1:1 com orders
// Armazena informações de pagamento do Mercado Pago
export const payments = mysqlTable(
  'payments',
  {
    id:                int('id').autoincrement().primaryKey(),
    orderId:           int('order_id').notNull().unique().references(() => orders.id, { onDelete: 'cascade' }),
    provider:          mysqlEnum('provider', ['mercadopago']).notNull().default('mercadopago'),
    providerPaymentId: varchar('provider_payment_id', { length: 255 }),
    // ID do pagamento no Mercado Pago
    method:            mysqlEnum('method', ['pix', 'credit_card', 'debit_card']).notNull(),
    status:            mysqlEnum('status', ['pending', 'paid', 'failed', 'refunded', 'in_process', 'cancelled'])
                         .notNull()
                         .default('pending'),
    amount:            decimal('amount', { precision: 10, scale: 2 }).notNull(),
    // Pix
    pixQrCode:         text('pix_qr_code'),
    // QR code em base64
    pixQrCodeText:     text('pix_qr_code_text'),
    // Código copia e cola
    pixExpiration:     timestamp('pix_expiration'),
    // Pix expira em 30 minutos por padrão
    // Cartão
    cardLastFour:      varchar('card_last_four', { length: 4 }),
    cardBrand:         varchar('card_brand', { length: 20 }),
    // Timestamps de status
    paidAt:            timestamp('paid_at'),
    failedAt:          timestamp('failed_at'),
    refundedAt:        timestamp('refunded_at'),
    // Payload raw do webhook (para auditoria)
    webhookPayload:    text('webhook_payload'),
    createdAt:         timestamp('created_at').defaultNow().notNull(),
    updatedAt:         timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderIdIdx:           uniqueIndex('payments_order_id_idx').on(table.orderId),
    providerPaymentIdIdx: index('payments_provider_payment_id_idx').on(table.providerPaymentId),
    statusIdx:            index('payments_status_idx').on(table.status),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────
export type Payment     = typeof payments.$inferSelect
export type NewPayment  = typeof payments.$inferInsert
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'in_process' | 'cancelled'
