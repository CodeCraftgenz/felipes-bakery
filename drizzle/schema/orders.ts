import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  tinyint,
  timestamp,
  date,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { customers } from './customers'
import { products } from './products'
import { coupons } from './coupons'
import { users } from './users'
import { payments } from './payments'

// ─── Enums ────────────────────────────────────────────────
export type OrderStatus =
  | 'pending_payment'  // aguardando pagamento
  | 'payment_failed'   // pagamento falhou
  | 'paid'             // pago — inicia produção
  | 'in_production'    // em preparo
  | 'ready'            // pronto para entrega/retirada
  | 'out_for_delivery' // saiu para entrega
  | 'delivered'        // entregue
  | 'cancelled'        // cancelado

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card'

// ─── Tabela: orders ───────────────────────────────────────
export const orders = mysqlTable(
  'orders',
  {
    id:              int('id').autoincrement().primaryKey(),
    customerId:      int('customer_id').references(() => customers.id),
    // Null = guest checkout
    orderNumber:     varchar('order_number', { length: 30 }).notNull().unique(),
    // Formato: FBK-20260412-0001
    status:          mysqlEnum('status', [
                       'pending_payment', 'payment_failed', 'paid',
                       'in_production', 'ready', 'out_for_delivery',
                       'delivered', 'cancelled',
                     ]).notNull().default('pending_payment'),
    subtotal:        decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount:  decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    shippingAmount:  decimal('shipping_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    total:           decimal('total', { precision: 10, scale: 2 }).notNull(),
    couponId:        int('coupon_id').references(() => coupons.id),
    paymentMethod:   mysqlEnum('payment_method', ['pix', 'credit_card', 'debit_card']),
    paymentStatus:   mysqlEnum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
                       .notNull()
                       .default('pending'),
    // Observações do cliente
    notes:           text('notes'),
    // Endereço de entrega (snapshot — não FK para customer_addresses)
    deliveryName:    varchar('delivery_name', { length: 255 }),
    deliveryStreet:  varchar('delivery_street', { length: 255 }),
    deliveryNumber:  varchar('delivery_number', { length: 20 }),
    deliveryComp:    varchar('delivery_complement', { length: 100 }),
    deliveryNeigh:   varchar('delivery_neighborhood', { length: 100 }),
    deliveryCity:    varchar('delivery_city', { length: 100 }),
    deliveryState:   varchar('delivery_state', { length: 2 }),
    deliveryZip:     varchar('delivery_zip', { length: 9 }),
    // Data estimada de entrega (calculada pelo ciclo da loja)
    deliveryDate:    date('delivery_date'),
    createdAt:       timestamp('created_at').defaultNow().notNull(),
    updatedAt:       timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderNumberIdx:   uniqueIndex('orders_order_number_idx').on(table.orderNumber),
    customerIdx:      index('orders_customer_id_idx').on(table.customerId, table.createdAt),
    statusIdx:        index('orders_status_idx').on(table.status, table.createdAt),
    paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
    createdAtIdx:     index('orders_created_at_idx').on(table.createdAt),
    deliveryDateIdx:  index('orders_delivery_date_idx').on(table.deliveryDate),
  }),
)

// ─── Tabela: order_items ──────────────────────────────────
// Snapshot dos produtos no momento do pedido
// Nunca referenciar dados de products diretamente para exibir histórico
export const orderItems = mysqlTable(
  'order_items',
  {
    id:           int('id').autoincrement().primaryKey(),
    orderId:      int('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId:    int('product_id').references(() => products.id),
    // Snapshot — mantidos mesmo se produto for deletado
    productName:  varchar('product_name', { length: 255 }).notNull(),
    productPrice: decimal('product_price', { precision: 10, scale: 2 }).notNull(),
    productSlug:  varchar('product_slug', { length: 255 }),
    quantity:     int('quantity').notNull(),
    subtotal:     decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => ({
    orderIdIdx:   index('order_items_order_id_idx').on(table.orderId),
    productIdIdx: index('order_items_product_id_idx').on(table.productId),
  }),
)

// ─── Tabela: order_status_history ─────────────────────────
// Append-only — nunca atualizado, sempre inserido
// Rastreabilidade completa de mudanças de status
export const orderStatusHistory = mysqlTable(
  'order_status_history',
  {
    id:        int('id').autoincrement().primaryKey(),
    orderId:   int('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    status:    mysqlEnum('status', [
                 'pending_payment', 'payment_failed', 'paid',
                 'in_production', 'ready', 'out_for_delivery',
                 'delivered', 'cancelled',
               ]).notNull(),
    note:      varchar('note', { length: 500 }),
    // Nota explicativa (ex: "Pedido cancelado pelo cliente")
    userId:    int('user_id').references(() => users.id),
    // Null = sistema (ex: webhook MP)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx:   index('order_status_history_order_id_idx').on(table.orderId),
    createdAtIdx: index('order_status_history_created_at_idx').on(table.createdAt),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer:      one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  coupon:        one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  items:         many(orderItems),
  statusHistory: many(orderStatusHistory),
  payment:       one(payments),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order:   one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}))

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  user:  one(users, { fields: [orderStatusHistory.userId], references: [users.id] }),
}))

// ─── Types ────────────────────────────────────────────────
export type Order              = typeof orders.$inferSelect
export type NewOrder           = typeof orders.$inferInsert
export type OrderItem          = typeof orderItems.$inferSelect
export type NewOrderItem       = typeof orderItems.$inferInsert
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect

export type OrderWithItems = Order & {
  items: OrderItem[]
  statusHistory: OrderStatusHistory[]
  payment?: import('./payments').Payment | null
}
