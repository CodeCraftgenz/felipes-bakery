import {
  mysqlTable,
  int,
  varchar,
  text,
  tinyint,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { products } from './products'

// ─── Tabela: categories ───────────────────────────────────
export const categories = mysqlTable(
  'categories',
  {
    id:           int('id').autoincrement().primaryKey(),
    name:         varchar('name', { length: 100 }).notNull(),
    slug:         varchar('slug', { length: 100 }).notNull().unique(),
    description:  text('description'),
    imageUrl:     varchar('image_url', { length: 500 }),
    // Imagem de capa da categoria
    displayOrder: int('display_order').notNull().default(0),
    isActive:     tinyint('is_active').notNull().default(1),
    // Soft delete
    deletedAt:    timestamp('deleted_at'),
    createdAt:    timestamp('created_at').defaultNow().notNull(),
    updatedAt:    timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx:         uniqueIndex('categories_slug_idx').on(table.slug),
    isActiveIdx:     index('categories_is_active_idx').on(table.isActive),
    displayOrderIdx: index('categories_display_order_idx').on(table.displayOrder),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

// ─── Types ────────────────────────────────────────────────
export type Category    = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
