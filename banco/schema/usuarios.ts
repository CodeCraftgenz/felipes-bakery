/**
 * Schema: Usuários Internos do Admin (tabela `users`)
 *
 * Representa os funcionários e administradores com acesso
 * ao painel administrativo da Felipe's Bakery.
 *
 * NÃO confundir com `clientes` (tabela `customers`), que são
 * os compradores do site público.
 *
 * Papéis disponíveis:
 *   - admin_master → acesso total, incluindo gestão de usuários
 *   - admin        → acesso a produtos, pedidos, relatórios e configurações
 *   - operador     → acesso somente a pedidos e estoque (uso diário na operação)
 */

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

// Importações cíclicas resolvidas via re-export no index — referências
// somente como tipo, sem uso concreto neste arquivo.

// ─── Tabela: users ────────────────────────────────────────
export const usuarios = mysqlTable(
  'users',
  {
    /** Identificador único do usuário */
    id: int('id').autoincrement().primaryKey(),

    /** E-mail do usuário — usado para login, deve ser único */
    email: varchar('email', { length: 255 }).notNull().unique(),

    /** Senha hasheada com bcrypt (cost factor 12) — nunca armazenar em texto plano */
    senhaHash: varchar('password_hash', { length: 255 }).notNull(),

    /** Nome completo para exibição no painel */
    nome: varchar('name', { length: 255 }).notNull(),

    /** Papel do usuário no sistema (RBAC) */
    papel: mysqlEnum('role', ['admin_master', 'admin', 'operador'])
      .notNull()
      .default('operador'),

    /** Se falso, o usuário não consegue fazer login */
    ativo: tinyint('is_active').notNull().default(1),

    /** Data e hora do último login bem-sucedido */
    ultimoLoginEm: timestamp('last_login_at'),

    /** Data de criação do registro */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização do registro */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    // Índice no e-mail para buscas de login
    emailIdx:    index('users_email_idx').on(tabela.email),
    // Índice no papel para filtros de permissão
    papelIdx:    index('users_role_idx').on(tabela.papel),
    // Índice no status ativo para queries de usuários disponíveis
    ativoIdx:    index('users_is_active_idx').on(tabela.ativo),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const usuariosRelations = relations(usuarios, ({ many }) => ({
  /** Logs de auditoria das ações deste usuário */
  logsAuditoria: many({} as any), // referência resolvida no index

  /** Movimentações de estoque realizadas por este usuário */
  movimentacoesEstoque: many({} as any),

  /** Atualizações de status de pedido feitas por este usuário */
  historicoStatusPedido: many({} as any),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
/** Registro completo de usuário (incluindo senhaHash — não expor na API) */
export type Usuario = typeof usuarios.$inferSelect

/** Dados para inserção de novo usuário */
export type NovoUsuario = typeof usuarios.$inferInsert

/** Papel do usuário no sistema RBAC */
export type PapelUsuario = 'admin_master' | 'admin' | 'operador'

/** Usuário sem a senha — seguro para retornar na API */
export type UsuarioPublico = Omit<Usuario, 'senhaHash'>
