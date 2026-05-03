import {
  mysqlTable,
  int,
  bigint,
  varchar,
  json,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { customers } from './customers'
import { products } from './products'

// ─── Enum de Eventos ──────────────────────────────────────
export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'search'
  | 'category_filter'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'checkout_step'
  | 'coupon_applied'
  | 'payment_initiated'
  | 'purchase'
  | 'login'
  | 'register'
  | 'whatsapp_click'
  | 'contact_form'

// ─── Tabela: analytics_sessions ───────────────────────────
// Uma "sessão" por visitante (identifica o browser/dispositivo)
export const analyticsSessions = mysqlTable(
  'analytics_sessions',
  {
    id:           int('id').autoincrement().primaryKey(),
    sessionId:    varchar('session_id', { length: 36 }).notNull().unique(),
    // UUID v4 gerado no browser, armazenado em cookie de 1 ano
    customerId:   int('customer_id').references(() => customers.id),
    // Null = visitante não logado
    deviceType:   mysqlEnum('device_type', ['mobile', 'tablet', 'desktop']),
    browser:      varchar('browser', { length: 50 }),
    os:           varchar('os', { length: 50 }),
    // Origem
    utmSource:    varchar('utm_source', { length: 100 }),
    utmMedium:    varchar('utm_medium', { length: 100 }),
    utmCampaign:  varchar('utm_campaign', { length: 100 }),
    referrer:     varchar('referrer', { length: 500 }),
    landingPage:  varchar('landing_page', { length: 500 }),
    // IP anonimizado (SHA-256 hash) — LGPD compliant
    ipHash:       varchar('ip_hash', { length: 64 }),
    startedAt:    timestamp('started_at').defaultNow().notNull(),
    lastSeenAt:   timestamp('last_seen_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx:  index('analytics_sessions_session_id_idx').on(table.sessionId),
    customerIdIdx: index('analytics_sessions_customer_id_idx').on(table.customerId),
    startedAtIdx:  index('analytics_sessions_started_at_idx').on(table.startedAt),
    deviceIdx:     index('analytics_sessions_device_idx').on(table.deviceType),
  }),
)

// ─── Tabela: analytics_events ─────────────────────────────
// Todos os eventos rastreados no site
// BIGINT para suportar alto volume sem overflow
export const analyticsEvents = mysqlTable(
  'analytics_events',
  {
    id:         bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    sessionId:  int('session_id').notNull().references(() => analyticsSessions.id),
    eventType:  mysqlEnum('event_type', [
                  'page_view', 'product_view', 'search', 'category_filter',
                  'add_to_cart', 'remove_from_cart', 'begin_checkout',
                  'checkout_step', 'coupon_applied', 'payment_initiated',
                  'purchase', 'login', 'register', 'whatsapp_click', 'contact_form',
                ]).notNull(),
    payload:    json('payload'),
    // Dados contextuais do evento:
    // product_view: { product_id, product_name, category_id, price }
    // add_to_cart: { product_id, quantity, price }
    // purchase: { order_id, total, items_count, coupon_used }
    // search: { query, results_count }
    pageUrl:    varchar('page_url', { length: 500 }),
    createdAt:  timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionEventIdx: index('analytics_events_session_event_idx').on(table.sessionId, table.eventType),
    eventTypeIdx:    index('analytics_events_event_type_idx').on(table.eventType),
    createdAtIdx:    index('analytics_events_created_at_idx').on(table.createdAt),
  }),
)

// ─── Tabela: analytics_page_views ────────────────────────
// Pré-agregado de page views por produto — facilita queries de "mais vistos"
export const analyticsPageViews = mysqlTable(
  'analytics_page_views',
  {
    id:              int('id').autoincrement().primaryKey(),
    sessionId:       int('session_id').notNull().references(() => analyticsSessions.id),
    productId:       int('product_id').references(() => products.id),
    // Null para páginas não-produto
    pageUrl:         varchar('page_url', { length: 500 }).notNull(),
    durationSeconds: int('duration_seconds'),
    // Tempo de permanência na página
    createdAt:       timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productCreatedIdx: index('analytics_page_views_product_created_idx')
                         .on(table.productId, table.createdAt),
    sessionIdx:        index('analytics_page_views_session_idx').on(table.sessionId),
    createdAtIdx:      index('analytics_page_views_created_at_idx').on(table.createdAt),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const analyticsSessionsRelations = relations(analyticsSessions, ({ one, many }) => ({
  customer:  one(customers, {
    fields: [analyticsSessions.customerId],
    references: [customers.id],
  }),
  events:    many(analyticsEvents),
  pageViews: many(analyticsPageViews),
}))

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  session: one(analyticsSessions, {
    fields: [analyticsEvents.sessionId],
    references: [analyticsSessions.id],
  }),
}))

export const analyticsPageViewsRelations = relations(analyticsPageViews, ({ one }) => ({
  session: one(analyticsSessions, {
    fields: [analyticsPageViews.sessionId],
    references: [analyticsSessions.id],
  }),
  product: one(products, {
    fields: [analyticsPageViews.productId],
    references: [products.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────
export type AnalyticsSession    = typeof analyticsSessions.$inferSelect
export type NewAnalyticsSession = typeof analyticsSessions.$inferInsert
export type AnalyticsEvent      = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent   = typeof analyticsEvents.$inferInsert
export type AnalyticsPageView   = typeof analyticsPageViews.$inferSelect
