/**
 * Schema: Entidades de Suporte
 * (banners, logs de auditoria, configurações, contatos, páginas)
 *
 * Este arquivo agrupa entidades menores que não justificam arquivo próprio:
 *   - banners          → banners do hero e seções promocionais
 *   - audit_logs       → rastreabilidade de ações administrativas
 *   - store_settings   → configurações gerais da loja (singleton)
 *   - contact_messages → mensagens do formulário de contato
 *   - pages_content    → conteúdo editável das páginas institucionais
 */

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
import { usuarios }  from './usuarios'

// ─── Tabela: banners ──────────────────────────────────────
export const banners = mysqlTable(
  'banners',
  {
    /** Identificador único do banner */
    id: int('id').autoincrement().primaryKey(),

    /**
     * Título do banner (visível apenas no admin, para identificação).
     * Exemplo: "Promoção de Natal 2026"
     */
    titulo: varchar('title', { length: 255 }).notNull(),

    /** URL da imagem do banner armazenada no R2 */
    urlImagem: varchar('image_url', { length: 500 }).notNull(),

    /**
     * URL de destino ao clicar no banner.
     * Pode ser uma rota interna (ex: /categoria/paes-rusticos) ou URL externa.
     * NULL = banner sem link.
     */
    urlLink: varchar('link_url', { length: 500 }),

    /**
     * Ordem de exibição dos banners no carrossel.
     * Menor número = exibido primeiro.
     */
    ordemExibicao: int('display_order').notNull().default(0),

    /** Se o banner está ativo */
    ativo: tinyint('is_active').notNull().default(1),

    /**
     * Data de início de exibição.
     * NULL = sem restrição de data inicial (exibe imediatamente se ativo)
     */
    validoDesde: timestamp('valid_from'),

    /**
     * Data de término de exibição.
     * NULL = sem vencimento
     */
    validoAte: timestamp('valid_until'),

    /** Data de criação */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    ativoIdx:      index('banners_is_active_idx').on(tabela.ativo),
    ordemIdx:      index('banners_display_order_idx').on(tabela.ordemExibicao),
    validadeIdx:   index('banners_validity_idx').on(tabela.ativo, tabela.validoDesde, tabela.validoAte),
  }),
)

// ─── Tabela: audit_logs (logs de auditoria) ───────────────
export const logsAuditoria = mysqlTable(
  'audit_logs',
  {
    /** Identificador único do log */
    id: int('id').autoincrement().primaryKey(),

    /**
     * Usuário admin que realizou a ação.
     * NULL = ação do sistema (automação, webhook).
     */
    usuarioId: int('user_id').references(() => usuarios.id),

    /**
     * Ação realizada — formato: "entidade.acao"
     * Exemplos: "produto.criar", "pedido.status_atualizado", "cupom.excluir"
     */
    acao: varchar('action', { length: 100 }).notNull(),

    /**
     * Tipo da entidade afetada.
     * Exemplos: "produto", "pedido", "usuario", "cupom"
     */
    tipoEntidade: varchar('entity_type', { length: 50 }).notNull(),

    /** ID da entidade afetada */
    idEntidade: int('entity_id'),

    /**
     * Estado anterior da entidade (antes da modificação).
     * NULL para criações.
     */
    valorAnterior: json('old_value'),

    /**
     * Estado novo da entidade (após a modificação).
     * NULL para exclusões.
     */
    valorNovo: json('new_value'),

    /** Endereço IP do admin que realizou a ação */
    enderecoIp: varchar('ip_address', { length: 45 }),

    /** User-Agent do navegador do admin */
    userAgent: varchar('user_agent', { length: 500 }),

    /** Data e hora da ação — APPEND ONLY, nunca deletar logs */
    criadoEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    usuarioDataIdx:  index('audit_logs_user_date_idx').on(tabela.usuarioId, tabela.criadoEm),
    acaoIdx:         index('audit_logs_action_idx').on(tabela.acao),
    entidadeIdx:     index('audit_logs_entity_idx').on(tabela.tipoEntidade, tabela.idEntidade),
    dataIdx:         index('audit_logs_created_at_idx').on(tabela.criadoEm),
  }),
)

// ─── Tabela: store_settings (configurações da loja) ───────
export const configuracoes = mysqlTable(
  'store_settings',
  {
    /**
     * Sempre id = 1 — esta tabela é um singleton.
     * Não criar múltiplos registros.
     */
    id: int('id').primaryKey().default(1),

    /** Nome exibido no site e e-mails */
    nomeLoja: varchar('store_name', { length: 255 }).notNull().default("Felipe's Bakery"),

    /** Telefone de contato exibido no site */
    telefone: varchar('store_phone', { length: 20 }),

    /**
     * Número do WhatsApp com código do país e DDD.
     * Formato: 5516997684430 (55=Brasil, 16=DDD)
     */
    whatsapp: varchar('store_whatsapp', { length: 20 }).default('5516997684430'),

    /** E-mail de contato exibido no site */
    emailContato: varchar('store_email', { length: 255 }),

    /** Endereço físico da padaria */
    endereco: varchar('store_address', { length: 500 }),

    // ── Ciclo de pedidos da Felix's Bakery ────────────────
    /**
     * Dia da semana de corte para pedidos.
     * 0=Domingo, 1=Segunda ... 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
     * Padrão: 3 (Quarta-feira)
     */
    diaCorte: int('order_cutoff_day').notNull().default(3),

    /**
     * Hora de corte (0-23).
     * Padrão: 23 (23h da quarta-feira)
     */
    horaCorte: int('order_cutoff_hour').notNull().default(23),

    /**
     * Dia da semana de entrega.
     * Padrão: 5 (Sexta-feira)
     */
    diaEntrega: int('delivery_day').notNull().default(5),

    // ── Configurações de frete ─────────────────────────────
    /** Taxa de entrega padrão em Reais (0 = grátis) */
    taxaFrete: varchar('shipping_fee', { length: 20 }).default('0.00'),

    /**
     * Valor mínimo de pedido para frete grátis.
     * NULL = frete nunca é grátis automaticamente.
     */
    freteGratisAcima: varchar('free_shipping_above', { length: 20 }),

    // ── Modo manutenção ───────────────────────────────────
    /**
     * Quando ativo, o site público exibe uma mensagem de manutenção.
     * O painel admin continua acessível.
     */
    modoManutencao: tinyint('maintenance_mode').notNull().default(0),

    /** Mensagem exibida durante manutenção */
    mensagemManutencao: varchar('maintenance_message', { length: 500 }),

    /** Data da última atualização das configurações */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
)

// ─── Tabela: contact_messages (mensagens de contato) ──────
export const mensagensContato = mysqlTable(
  'contact_messages',
  {
    /** Identificador único da mensagem */
    id: int('id').autoincrement().primaryKey(),

    /** Nome de quem enviou o formulário */
    nome: varchar('name', { length: 255 }).notNull(),

    /** E-mail para resposta */
    email: varchar('email', { length: 255 }).notNull(),

    /** Telefone (opcional) */
    telefone: varchar('phone', { length: 20 }),

    /** Conteúdo da mensagem */
    mensagem: text('message').notNull(),

    /**
     * Status de atendimento da mensagem:
     *   - nova      → ainda não foi lida
     *   - lida      → foi visualizada no admin
     *   - respondida → foi respondida pelo e-mail ou telefone
     */
    status: mysqlEnum('status', ['nova', 'lida', 'respondida']).notNull().default('nova'),

    /** Data de envio */
    criadoEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    statusIdx: index('contact_messages_status_idx').on(tabela.status),
    dataIdx:   index('contact_messages_created_at_idx').on(tabela.criadoEm),
  }),
)

// ─── Tabela: pages_content (conteúdo de páginas) ──────────
export const conteudoPaginas = mysqlTable(
  'pages_content',
  {
    /** Identificador único da página */
    id: int('id').autoincrement().primaryKey(),

    /**
     * Slug identificador da página.
     * Exemplos: "sobre", "faq", "politica-de-privacidade"
     */
    slug: varchar('slug', { length: 100 }).notNull().unique(),

    /** Título da página */
    titulo: varchar('title', { length: 255 }).notNull(),

    /**
     * Conteúdo da página em JSON estruturado.
     * Formato: array de blocos { tipo: 'paragrafo'|'titulo'|'lista', conteudo: string }
     * Permite edição visual no painel admin sem HTML direto.
     */
    conteudo: json('content').notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),

    /** Usuário admin que fez a última atualização */
    atualizadoPor: int('updated_by').references(() => usuarios.id),
  },
  (tabela) => ({
    slugIdx: uniqueIndex('pages_content_slug_idx').on(tabela.slug),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const logsAuditoriaRelations = relations(logsAuditoria, ({ one }) => ({
  usuario: one(usuarios, {
    fields:     [logsAuditoria.usuarioId],
    references: [usuarios.id],
  }),
}))

export const conteudoPaginasRelations = relations(conteudoPaginas, ({ one }) => ({
  usuarioAtualizacao: one(usuarios, {
    fields:     [conteudoPaginas.atualizadoPor],
    references: [usuarios.id],
  }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Banner           = typeof banners.$inferSelect
export type NovoBanner       = typeof banners.$inferInsert
export type LogAuditoria     = typeof logsAuditoria.$inferSelect
export type NovoLogAuditoria = typeof logsAuditoria.$inferInsert
export type Configuracoes    = typeof configuracoes.$inferSelect
export type MensagemContato  = typeof mensagensContato.$inferSelect
export type ConteudoPagina   = typeof conteudoPaginas.$inferSelect
