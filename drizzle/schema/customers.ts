import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { orders } from './orders'
import { couponUses } from './coupons'
import { analyticsSessions } from './analytics'

// ─── Tabela: customers ────────────────────────────────────
// Clientes do site público (separados dos users admin)
export const customers = mysqlTable(
  'customers',
  {
    id:              int('id').autoincrement().primaryKey(),
    email:           varchar('email', { length: 255 }).notNull().unique(),
    passwordHash:    varchar('password_hash', { length: 255 }),
    // Null quando autenticado via OAuth
    name:            varchar('name', { length: 255 }).notNull(),
    phone:           varchar('phone', { length: 20 }),
    emailVerified:   tinyint('email_verified').notNull().default(0),
    isActive:        tinyint('is_active').notNull().default(1),
    // OAuth provider info
    googleId:        varchar('google_id', { length: 255 }),
    avatarUrl:       varchar('avatar_url', { length: 500 }),
    // LGPD
    acceptedTermsAt: timestamp('accepted_terms_at'),
    marketingOptIn:  tinyint('marketing_opt_in').notNull().default(0),
    deletedAt:       timestamp('deleted_at'),
    // Timestamps
    createdAt:       timestamp('created_at').defaultNow().notNull(),
    updatedAt:       timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx:     uniqueIndex('customers_email_idx').on(table.email),
    googleIdIdx:  index('customers_google_id_idx').on(table.googleId),
    isActiveIdx:  index('customers_is_active_idx').on(table.isActive),
    deletedAtIdx: index('customers_deleted_at_idx').on(table.deletedAt),
  }),
)

// ─── Tabela: customer_addresses ───────────────────────────
export const customerAddresses = mysqlTable(
  'customer_addresses',
  {
    id:             int('id').autoincrement().primaryKey(),
    customerId:     int('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    label:          varchar('label', { length: 50 }).default('Casa'),
    // Ex: "Casa", "Trabalho"
    recipientName:  varchar('recipient_name', { length: 255 }).notNull(),
    street:         varchar('street', { length: 255 }).notNull(),
    number:         varchar('number', { length: 20 }).notNull(),
    complement:     varchar('complement', { length: 100 }),
    neighborhood:   varchar('neighborhood', { length: 100 }).notNull(),
    city:           varchar('city', { length: 100 }).notNull(),
    state:          varchar('state', { length: 2 }).notNull(),
    zipCode:        varchar('zip_code', { length: 9 }).notNull(),
    // Ex: "13000-000"
    isDefault:      tinyint('is_default').notNull().default(0),
    createdAt:      timestamp('created_at').defaultNow().notNull(),
    updatedAt:      timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    customerIdIdx: index('customer_addresses_customer_id_idx').on(table.customerId),
    isDefaultIdx:  index('customer_addresses_is_default_idx').on(table.customerId, table.isDefault),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const customersRelations = relations(customers, ({ many }) => ({
  addresses:         many(customerAddresses),
  orders:            many(orders),
  couponUses:        many(couponUses),
  analyticsSessions: many(analyticsSessions),
}))

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────
export type Customer        = typeof customers.$inferSelect
export type NewCustomer     = typeof customers.$inferInsert
export type CustomerAddress = typeof customerAddresses.$inferSelect
export type NewCustomerAddress = typeof customerAddresses.$inferInsert
export type CustomerPublic  = Omit<Customer, 'passwordHash' | 'googleId'>
