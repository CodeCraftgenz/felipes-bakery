// ============================================================
// Drizzle Schema — Felipe's Bakery
// Ponto de entrada único para todos os schemas
// ============================================================

// Usuários internos (admin)
export * from './users'

// Clientes do site público
export * from './customers'

// Catálogo
export * from './categories'
export * from './products'

// Estoque
export * from './stock'

// Pedidos e pagamentos.
// Re-exporta `payments` excluindo `PaymentStatus` (já exportado por `./orders`
// com tipo mais restrito). Use `PaymentStatusMP` quando precisar dos status
// estendidos do Mercado Pago.
export * from './orders'
export {
  payments,
  paymentsRelations,
  type Payment,
  type NewPayment,
  type PaymentStatus as PaymentStatusMP,
} from './payments'

// Cupons
export * from './coupons'

// Analytics
export * from './analytics'

// Miscelânea (banners, audit_logs, store_settings, contact_messages, pages_content)
export * from './misc'
