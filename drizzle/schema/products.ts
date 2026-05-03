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
import { categories } from './categories'
import { stock, stockMovements } from './stock'
import { orderItems } from './orders'

// ─── Enum de Status ───────────────────────────────────────
export const productStatusEnum = mysqlEnum('status', [
  'published', // visível no site
  'draft',     // rascunho, não visível
  'archived',  // arquivado, soft-removido da listagem
])

// ─── Tabela: products ─────────────────────────────────────
export const products = mysqlTable(
  'products',
  {
    id:           int('id').autoincrement().primaryKey(),
    categoryId:   int('category_id').notNull().references(() => categories.id),
    name:         varchar('name', { length: 255 }).notNull(),
    slug:         varchar('slug', { length: 255 }).notNull().unique(),
    description:  text('description'),
    ingredients:  text('ingredients'),
    // Lista de ingredientes (texto livre)
    weightGrams:  int('weight_grams'),
    // Peso em gramas — ex: 450 para "450g"
    price:        decimal('price', { precision: 10, scale: 2 }).notNull(),
    comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
    // Preço "de" (riscado) para promoções
    isActive:     tinyint('is_active').notNull().default(1),
    isFeatured:   tinyint('is_featured').notNull().default(0),
    status:       mysqlEnum('status', ['published', 'draft', 'archived'])
                    .notNull()
                    .default('draft'),
    // Soft delete
    deletedAt:    timestamp('deleted_at'),
    createdAt:    timestamp('created_at').defaultNow().notNull(),
    updatedAt:    timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx:          uniqueIndex('products_slug_idx').on(table.slug),
    catalogIdx:       index('products_catalog_idx').on(table.categoryId, table.isActive, table.status),
    featuredIdx:      index('products_featured_idx').on(table.isFeatured, table.isActive),
    deletedAtIdx:     index('products_deleted_at_idx').on(table.deletedAt),
    priceIdx:         index('products_price_idx').on(table.price),
  }),
)

// ─── Tabela: product_images ───────────────────────────────
export const productImages = mysqlTable(
  'product_images',
  {
    id:           int('id').autoincrement().primaryKey(),
    productId:    int('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    url:          varchar('url', { length: 500 }).notNull(),
    // URL completa do R2/CDN
    altText:      varchar('alt_text', { length: 255 }),
    displayOrder: int('display_order').notNull().default(0),
    isPrimary:    tinyint('is_primary').notNull().default(0),
    // Imagem principal para listagens
    createdAt:    timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx:  index('product_images_product_id_idx').on(table.productId),
    displayOrderIdx: index('product_images_order_idx').on(table.productId, table.displayOrder),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
  category:       one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images:         many(productImages),
  stock:          one(stock),
  stockMovements: many(stockMovements),
  orderItems:     many(orderItems),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────
export type Product      = typeof products.$inferSelect
export type NewProduct   = typeof products.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert
export type ProductStatus = 'published' | 'draft' | 'archived'

export type ProductWithImages = Product & {
  images: ProductImage[]
  stock?: { quantity: number; minQuantityAlert: number } | null
}
