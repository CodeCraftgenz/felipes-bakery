import {
  mysqlTable,
  int,
  varchar,
  text,
  tinyint,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { products } from './products'
import { users } from './users'
import { orders } from './orders'

// ─── Tabela: stock ────────────────────────────────────────
// Relação 1:1 com products — cada produto tem um registro de estoque
export const stock = mysqlTable(
  'stock',
  {
    id:                 int('id').autoincrement().primaryKey(),
    productId:          int('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
    quantity:           int('quantity').notNull().default(0),
    minQuantityAlert:   int('min_quantity_alert').notNull().default(3),
    // Dispara alerta no admin quando quantity <= minQuantityAlert
    updatedAt:          timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productIdIdx:  uniqueIndex('stock_product_id_idx').on(table.productId),
    quantityIdx:   index('stock_quantity_idx').on(table.quantity),
  }),
)

// ─── Tabela: stock_movements ──────────────────────────────
// Rastreia todas as movimentações de estoque (audit trail)
export const stockMovements = mysqlTable(
  'stock_movements',
  {
    id:         int('id').autoincrement().primaryKey(),
    productId:  int('product_id').notNull().references(() => products.id),
    type:       mysqlEnum('type', ['in', 'out', 'adjustment']).notNull(),
    // in = entrada, out = saída, adjustment = ajuste manual
    quantity:   int('quantity').notNull(),
    // Pode ser negativo em ajustes
    reason:     varchar('reason', { length: 255 }).notNull(),
    // Ex: "compra confirmada", "cancelamento", "ajuste de inventário"
    userId:     int('user_id').references(() => users.id),
    // Null = sistema (ex: pedido automático)
    orderId:    int('order_id'),
    // FK para orders — definida como int para evitar circular import
    // A FK real é gerenciada via migration
    createdAt:  timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index('stock_movements_product_id_idx').on(table.productId),
    typeIdx:      index('stock_movements_type_idx').on(table.type),
    createdAtIdx: index('stock_movements_created_at_idx').on(table.createdAt),
    userIdIdx:    index('stock_movements_user_id_idx').on(table.userId),
    orderIdIdx:   index('stock_movements_order_id_idx').on(table.orderId),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, {
    fields: [stock.productId],
    references: [products.id],
  }),
}))

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────
export type Stock            = typeof stock.$inferSelect
export type NewStock         = typeof stock.$inferInsert
export type StockMovement    = typeof stockMovements.$inferSelect
export type NewStockMovement = typeof stockMovements.$inferInsert
export type StockMovementType = 'in' | 'out' | 'adjustment'
