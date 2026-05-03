import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  tinyint,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { customers } from './customers'
import { orders } from './orders'

// ─── Tabela: coupons ──────────────────────────────────────
export const coupons = mysqlTable(
  'coupons',
  {
    id:                   int('id').autoincrement().primaryKey(),
    code:                 varchar('code', { length: 50 }).notNull().unique(),
    // Sempre armazenado em UPPERCASE
    description:          varchar('description', { length: 255 }),
    type:                 mysqlEnum('type', ['percent', 'fixed']).notNull(),
    // percent = % de desconto | fixed = valor fixo em R$
    value:                decimal('value', { precision: 10, scale: 2 }).notNull(),
    minOrderAmount:       decimal('min_order_amount', { precision: 10, scale: 2 }),
    // Valor mínimo do pedido para usar o cupom
    maxDiscountAmount:    decimal('max_discount_amount', { precision: 10, scale: 2 }),
    // Teto de desconto para cupons de percentual
    maxUses:              int('max_uses'),
    // Null = ilimitado
    currentUses:          int('current_uses').notNull().default(0),
    maxUsesPerCustomer:   int('max_uses_per_customer').notNull().default(1),
    appliesTo:            mysqlEnum('applies_to', ['all', 'category', 'product'])
                            .notNull()
                            .default('all'),
    appliesToId:          int('applies_to_id'),
    // FK para category.id ou product.id conforme appliesTo
    isActive:             tinyint('is_active').notNull().default(1),
    validFrom:            timestamp('valid_from'),
    validUntil:           timestamp('valid_until'),
    createdAt:            timestamp('created_at').defaultNow().notNull(),
    updatedAt:            timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx:     uniqueIndex('coupons_code_idx').on(table.code),
    isActiveIdx: index('coupons_is_active_idx').on(table.isActive),
    validIdx:    index('coupons_valid_idx').on(table.isActive, table.validFrom, table.validUntil),
  }),
)

// ─── Tabela: coupon_uses ──────────────────────────────────
// Registro de uso de cada cupom (para controle de maxUsesPerCustomer)
export const couponUses = mysqlTable(
  'coupon_uses',
  {
    id:             int('id').autoincrement().primaryKey(),
    couponId:       int('coupon_id').notNull().references(() => coupons.id),
    customerId:     int('customer_id').references(() => customers.id),
    // Null = guest checkout
    orderId:        int('order_id').notNull().references(() => orders.id),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
    usedAt:         timestamp('used_at').defaultNow().notNull(),
  },
  (table) => ({
    couponCustomerIdx: index('coupon_uses_coupon_customer_idx').on(table.couponId, table.customerId),
    couponIdIdx:       index('coupon_uses_coupon_id_idx').on(table.couponId),
    orderIdIdx:        index('coupon_uses_order_id_idx').on(table.orderId),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const couponsRelations = relations(coupons, ({ many }) => ({
  uses: many(couponUses),
}))

export const couponUsesRelations = relations(couponUses, ({ one }) => ({
  coupon:   one(coupons,   { fields: [couponUses.couponId],   references: [coupons.id] }),
  customer: one(customers, { fields: [couponUses.customerId], references: [customers.id] }),
  order:    one(orders,    { fields: [couponUses.orderId],    references: [orders.id] }),
}))

// ─── Types ────────────────────────────────────────────────
export type Coupon     = typeof coupons.$inferSelect
export type NewCoupon  = typeof coupons.$inferInsert
export type CouponUse  = typeof couponUses.$inferSelect
export type CouponType = 'percent' | 'fixed'
