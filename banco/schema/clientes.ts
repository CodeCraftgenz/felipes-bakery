/**
 * Schema: Clientes do Site Público (tabelas `customers` e `customer_addresses`)
 *
 * Representa os compradores que se cadastram e fazem pedidos
 * no site público da Felipe's Bakery.
 *
 * Diferença entre Cliente e Usuário:
 *   - `clientes` (customers) → compradores do site público
 *   - `usuarios` (users)     → funcionários com acesso ao admin
 *
 * O cliente pode se autenticar via:
 *   1. E-mail + senha (cadastro tradicional)
 *   2. Google OAuth (sem senha armazenada — passwordHash é nulo)
 *
 * Conformidade LGPD:
 *   - deletedAt + anonimização de dados pessoais no delete
 *   - marketingOptIn: consentimento explícito para comunicações
 *   - acceptedTermsAt: registro do aceite dos termos
 */

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

// ─── Tabela: customers (clientes) ─────────────────────────
export const clientes = mysqlTable(
  'customers',
  {
    /** Identificador único do cliente */
    id: int('id').autoincrement().primaryKey(),

    /** E-mail do cliente — usado para login e comunicações */
    email: varchar('email', { length: 255 }).notNull().unique(),

    /**
     * Senha hasheada com bcrypt.
     * NULL quando o cliente se autenticou via Google OAuth.
     */
    senhaHash: varchar('password_hash', { length: 255 }),

    /** Nome completo do cliente */
    nome: varchar('name', { length: 255 }).notNull(),

    /** Telefone para contato (opcional) */
    telefone: varchar('phone', { length: 20 }),

    /** Se o e-mail foi verificado via link de confirmação */
    emailVerificado: tinyint('email_verified').notNull().default(0),

    /** Se a conta está ativa. Falso = não consegue logar */
    ativo: tinyint('is_active').notNull().default(1),

    /** ID do Google para autenticação OAuth (pode ser nulo) */
    googleId: varchar('google_id', { length: 255 }),

    /** URL do avatar do Google (pode ser nulo) */
    urlAvatar: varchar('avatar_url', { length: 500 }),

    /**
     * Data em que o cliente aceitou os termos de uso.
     * Obrigatório para conformidade com a LGPD.
     */
    aceitouTermosEm: timestamp('accepted_terms_at'),

    /**
     * Consentimento para receber comunicações de marketing.
     * Deve ser opt-in explícito — nunca verdadeiro por padrão.
     */
    consentimentoMarketing: tinyint('marketing_opt_in').notNull().default(0),

    /**
     * Soft delete — quando preenchido, a conta foi excluída.
     * Os dados pessoais devem ser anonimizados (LGPD Art. 18, VI).
     */
    excluidoEm: timestamp('deleted_at'),

    /** Data de criação do registro */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    emailIdx:      uniqueIndex('customers_email_idx').on(tabela.email),
    googleIdIdx:   index('customers_google_id_idx').on(tabela.googleId),
    ativoIdx:      index('customers_is_active_idx').on(tabela.ativo),
    excluidoIdx:   index('customers_deleted_at_idx').on(tabela.excluidoEm),
  }),
)

// ─── Tabela: customer_addresses (endereços dos clientes) ──
export const enderecosCliente = mysqlTable(
  'customer_addresses',
  {
    /** Identificador único do endereço */
    id: int('id').autoincrement().primaryKey(),

    /** Referência ao cliente dono deste endereço */
    clienteId: int('customer_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),

    /**
     * Rótulo amigável do endereço.
     * Exemplos: "Casa", "Trabalho", "Apartamento"
     */
    rotulo: varchar('label', { length: 50 }).default('Casa'),

    /** Nome do destinatário para esta entrega */
    nomeDestinatario: varchar('recipient_name', { length: 255 }).notNull(),

    /** Logradouro (rua, avenida, etc.) */
    logradouro: varchar('street', { length: 255 }).notNull(),

    /** Número do imóvel */
    numero: varchar('number', { length: 20 }).notNull(),

    /** Complemento (apto, bloco, etc.) */
    complemento: varchar('complement', { length: 100 }),

    /** Bairro */
    bairro: varchar('neighborhood', { length: 100 }).notNull(),

    /** Cidade */
    cidade: varchar('city', { length: 100 }).notNull(),

    /** Estado — sigla de 2 letras (ex: "SP") */
    estado: varchar('state', { length: 2 }).notNull(),

    /** CEP no formato "00000-000" */
    cep: varchar('zip_code', { length: 9 }).notNull(),

    /** Se este é o endereço padrão do cliente */
    padrao: tinyint('is_default').notNull().default(0),

    /** Data de criação */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    // Índice composto para buscar endereços + padrão de um cliente
    clientePadraoIdx: index('customer_addresses_default_idx')
      .on(tabela.clienteId, tabela.padrao),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const clientesRelations = relations(clientes, ({ many }) => ({
  /** Endereços cadastrados pelo cliente */
  enderecos: many(enderecosCliente),
}))

export const enderecosClienteRelations = relations(enderecosCliente, ({ one }) => ({
  /** Cliente dono deste endereço */
  cliente: one(clientes, {
    fields:     [enderecosCliente.clienteId],
    references: [clientes.id],
  }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Cliente            = typeof clientes.$inferSelect
export type NovoCliente        = typeof clientes.$inferInsert
export type EnderecoCliente    = typeof enderecosCliente.$inferSelect
export type NovoEnderecoCliente = typeof enderecosCliente.$inferInsert

/** Cliente sem dados sensíveis — seguro para a sessão e APIs */
export type ClientePublico = Omit<Cliente, 'senhaHash' | 'googleId'>
