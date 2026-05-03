import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { stockMovements } from './stock'
import { orderStatusHistory } from './orders'

// ─── Enum de Roles ────────────────────────────────────────
export const userRoleEnum = mysqlEnum('role', [
  'admin_master',
  'admin',
  'operador',
])

// ─── Tabela: users ────────────────────────────────────────
// Usuários internos do painel administrativo
// NÃO confundir com `customers` (clientes do site público)
export const users = mysqlTable(
  'users',
  {
    id:            int('id').autoincrement().primaryKey(),
    email:         varchar('email', { length: 255 }).notNull().unique(),
    passwordHash:  varchar('password_hash', { length: 255 }).notNull(),
    name:          varchar('name', { length: 255 }).notNull(),
    role:          mysqlEnum('role', ['admin_master', 'admin', 'operador']).notNull().default('operador'),
    isActive:      tinyint('is_active').notNull().default(1),
    lastLoginAt:   timestamp('last_login_at'),
    createdAt:     timestamp('created_at').defaultNow().notNull(),
    updatedAt:     timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx:    index('users_email_idx').on(table.email),
    roleIdx:     index('users_role_idx').on(table.role),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
  }),
)

// ─── Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  stockMovements:     many(stockMovements),
  orderStatusHistory: many(orderStatusHistory),
}))

// ─── Types ────────────────────────────────────────────────
export type User         = typeof users.$inferSelect
export type NewUser      = typeof users.$inferInsert
export type UserRole     = 'admin_master' | 'admin' | 'operador'
export type UserPublic   = Omit<User, 'passwordHash'>
