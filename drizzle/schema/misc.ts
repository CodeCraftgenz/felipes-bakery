import {
  mysqlTable,
  int,
  varchar,
  text,
  tinyint,
  timestamp,
  mysqlEnum,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// ─── Tabela: banners ──────────────────────────────────────
// Banners do hero da home e seções promocionais
export const banners = mysqlTable(
  'banners',
  {
    id:           int('id').autoincrement().primaryKey(),
    title:        varchar('title', { length: 255 }).notNull(),
    imageUrl:     varchar('image_url', { length: 500 }).notNull(),
    linkUrl:      varchar('link_url', { length: 500 }),
    // URL de destino ao clicar no banner
    displayOrder: int('display_order').notNull().default(0),
    isActive:     tinyint('is_active').notNull().default(1),
    validFrom:    timestamp('valid_from'),
    validUntil:   timestamp('valid_until'),
    // Banner é exibido somente dentro deste intervalo
    createdAt:    timestamp('created_at').defaultNow().notNull(),
    updatedAt:    timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    isActiveIdx:     index('banners_is_active_idx').on(table.isActive),
    displayOrderIdx: index('banners_display_order_idx').on(table.displayOrder),
    validIdx:        index('banners_valid_idx').on(table.isActive, table.validFrom, table.validUntil),
  }),
)

// ─── Tabela: audit_logs ───────────────────────────────────
// Rastreia todas as ações administrativas
// Append-only — nunca deletado
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id:          int('id').autoincrement().primaryKey(),
    userId:      int('user_id').references(() => users.id),
    // Null = sistema
    action:      varchar('action', { length: 100 }).notNull(),
    // Ex: "product.create", "order.status_update", "coupon.delete"
    entityType:  varchar('entity_type', { length: 50 }).notNull(),
    // Ex: "product", "order", "user"
    entityId:    int('entity_id'),
    oldValue:    json('old_value'),
    newValue:    json('new_value'),
    ipAddress:   varchar('ip_address', { length: 45 }),
    // IPv4 ou IPv6
    userAgent:   varchar('user_agent', { length: 500 }),
    createdAt:   timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx:   index('audit_logs_user_created_idx').on(table.userId, table.createdAt),
    actionIdx:        index('audit_logs_action_idx').on(table.action),
    entityIdx:        index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx:     index('audit_logs_created_at_idx').on(table.createdAt),
  }),
)

// ─── Tabela: store_settings ───────────────────────────────
// Singleton — sempre id = 1
// Configurações gerais da loja (editáveis pelo admin)
export const storeSettings = mysqlTable(
  'store_settings',
  {
    id:                     int('id').primaryKey().default(1),
    storeName:              varchar('store_name', { length: 255 }).notNull().default("Felipe's Bakery"),
    storePhone:             varchar('store_phone', { length: 20 }),
    storeWhatsapp:          varchar('store_whatsapp', { length: 20 }).default('5516997684430'),
    storeEmail:             varchar('store_email', { length: 255 }),
    storeAddress:           varchar('store_address', { length: 500 }),
    // Ciclo de pedidos
    orderCutoffDay:         int('order_cutoff_day').notNull().default(3),
    // 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
    orderCutoffHour:        int('order_cutoff_hour').notNull().default(23),
    // Hora de corte (0-23)
    deliveryDay:            int('delivery_day').notNull().default(5),
    // 5 = Sexta-feira
    // Frete
    shippingFee:            varchar('shipping_fee', { length: 20 }).default('0.00'),
    freeShippingAbove:      varchar('free_shipping_above', { length: 20 }),
    // Manutenção
    maintenanceMode:        tinyint('maintenance_mode').notNull().default(0),
    maintenanceMessage:     varchar('maintenance_message', { length: 500 }),
    updatedAt:              timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
)

// ─── Tabela: contact_messages ─────────────────────────────
export const contactMessages = mysqlTable(
  'contact_messages',
  {
    id:        int('id').autoincrement().primaryKey(),
    name:      varchar('name', { length: 255 }).notNull(),
    email:     varchar('email', { length: 255 }).notNull(),
    phone:     varchar('phone', { length: 20 }),
    message:   text('message').notNull(),
    status:    mysqlEnum('status', ['new', 'read', 'replied']).notNull().default('new'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx:    index('contact_messages_status_idx').on(table.status),
    createdAtIdx: index('contact_messages_created_at_idx').on(table.createdAt),
  }),
)

// ─── Tabela: pages_content ────────────────────────────────
// Conteúdo editável das páginas institucionais (sobre, faq, etc.)
export const pagesContent = mysqlTable(
  'pages_content',
  {
    id:          int('id').autoincrement().primaryKey(),
    slug:        varchar('slug', { length: 100 }).notNull().unique(),
    // Ex: "sobre", "faq", "politica-de-privacidade"
    title:       varchar('title', { length: 255 }).notNull(),
    content:     json('content').notNull(),
    // JSON estruturado (blocos de conteúdo)
    updatedAt:   timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    updatedBy:   int('updated_by').references(() => users.id),
  },
  (table) => ({
    slugIdx: uniqueIndex('pages_content_slug_idx').on(table.slug),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

export const pagesContentRelations = relations(pagesContent, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [pagesContent.updatedBy],
    references: [users.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────
export type Banner         = typeof banners.$inferSelect
export type NewBanner      = typeof banners.$inferInsert
export type AuditLog       = typeof auditLogs.$inferSelect
export type NewAuditLog    = typeof auditLogs.$inferInsert
export type StoreSettings  = typeof storeSettings.$inferSelect
export type ContactMessage = typeof contactMessages.$inferSelect
export type PageContent    = typeof pagesContent.$inferSelect
