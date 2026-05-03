/**
 * Schema: Analytics e Rastreamento de Comportamento
 * (tabelas `analytics_sessions`, `analytics_events`, `analytics_page_views`)
 *
 * Sistema de analytics próprio — sem dependência de Google Analytics ou similares.
 * Motivo: conformidade LGPD, controle total dos dados, sem custo adicional.
 *
 * Arquitetura do rastreamento:
 *   1. Visitante acessa o site → cria/recupera sessão (cookie de 1 ano)
 *   2. Cada ação relevante dispara um evento via POST /api/analytics/eventos
 *   3. Page views de produto são registradas separadamente para queries rápidas
 *
 * Conformidade LGPD:
 *   - IP armazenado apenas como hash SHA-256 (dado pseudonimizado)
 *   - Dados nunca compartilhados com terceiros
 *   - Retenção: 2 anos, então deletados
 *   - Consentimento explícito via banner de cookies
 *
 * Eventos rastreados (ver TipoEvento):
 *   Navegação:   page_view, search, filtro_categoria
 *   Produto:     visualizacao_produto
 *   Carrinho:    adicionar_carrinho, remover_carrinho
 *   Checkout:    inicio_checkout, etapa_checkout, cupom_aplicado, pagamento_iniciado
 *   Conversão:   compra
 *   Conta:       login, cadastro
 *   Engajamento: clique_whatsapp, formulario_contato
 */

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
import { clientes }  from './clientes'
import { produtos }  from './produtos'

// ─── Tipo de evento ───────────────────────────────────────
/** Todos os tipos de evento rastreados no site */
export type TipoEvento =
  | 'page_view'             // visualização de qualquer página
  | 'visualizacao_produto'  // produto aberto
  | 'busca'                 // busca realizada
  | 'filtro_categoria'      // filtro aplicado no catálogo
  | 'adicionar_carrinho'    // produto adicionado ao carrinho
  | 'remover_carrinho'      // produto removido do carrinho
  | 'inicio_checkout'       // cliente começou o checkout
  | 'etapa_checkout'        // avançou uma etapa do checkout
  | 'cupom_aplicado'        // cupom usado com sucesso
  | 'pagamento_iniciado'    // selecionou método de pagamento
  | 'compra'                // pedido confirmado com sucesso
  | 'login'                 // login realizado
  | 'cadastro'              // nova conta criada
  | 'clique_whatsapp'       // clicou no botão do WhatsApp
  | 'formulario_contato'    // enviou formulário de contato

// ─── Tabela: analytics_sessions (sessões) ─────────────────
export const sessoesAnalytics = mysqlTable(
  'analytics_sessions',
  {
    /** Identificador único da sessão */
    id: int('id').autoincrement().primaryKey(),

    /**
     * UUID gerado no browser e armazenado em cookie de 1 ano.
     * Permite identificar o mesmo visitante entre sessões.
     */
    sessionId: varchar('session_id', { length: 36 }).notNull().unique(),

    /**
     * Cliente logado nesta sessão.
     * NULL = visitante não autenticado
     */
    clienteId: int('customer_id').references(() => clientes.id),

    /** Tipo de dispositivo detectado pelo User-Agent */
    tipoDispositivo: mysqlEnum('device_type', ['mobile', 'tablet', 'desktop']),

    /** Navegador detectado (ex: "Chrome", "Safari") */
    navegador: varchar('browser', { length: 50 }),

    /** Sistema operacional (ex: "Windows", "iOS", "Android") */
    sistemaOperacional: varchar('os', { length: 50 }),

    // ── Parâmetros de origem (UTM) ─────────────────────────
    /** Origem do tráfego (ex: "google", "whatsapp", "instagram") */
    utmSource: varchar('utm_source', { length: 100 }),

    /** Mídia (ex: "cpc", "social", "email") */
    utmMedium: varchar('utm_medium', { length: 100 }),

    /** Campanha específica */
    utmCampaign: varchar('utm_campaign', { length: 100 }),

    /** URL de referência (site de onde veio) */
    referrer: varchar('referrer', { length: 500 }),

    /** Primeira página visitada nesta sessão */
    paginaEntrada: varchar('landing_page', { length: 500 }),

    /**
     * Hash SHA-256 do IP do visitante.
     * Pseudonimização para conformidade com LGPD.
     * Não é possível reverter para o IP original.
     */
    ipHash: varchar('ip_hash', { length: 64 }),

    /** Início da sessão */
    iniciadaEm: timestamp('started_at').defaultNow().notNull(),

    /** Última atividade da sessão (atualizado a cada evento) */
    ultimaAtividadeEm: timestamp('last_seen_at').defaultNow().notNull(),
  },
  (tabela) => ({
    sessionIdIdx:    index('analytics_sessions_sid_idx').on(tabela.sessionId),
    clienteIdx:      index('analytics_sessions_customer_idx').on(tabela.clienteId),
    inicioIdx:       index('analytics_sessions_started_idx').on(tabela.iniciadaEm),
    dispositivoIdx:  index('analytics_sessions_device_idx').on(tabela.tipoDispositivo),
  }),
)

// ─── Tabela: analytics_events (eventos) ───────────────────
// BIGINT para suportar alto volume sem overflow do contador
export const eventosAnalytics = mysqlTable(
  'analytics_events',
  {
    /** ID do evento — BIGINT para suportar milhões de registros */
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),

    /** Sessão na qual o evento ocorreu */
    sessaoId: int('session_id')
      .notNull()
      .references(() => sessoesAnalytics.id),

    /** Tipo do evento (ver TipoEvento acima) */
    tipoEvento: mysqlEnum('event_type', [
      'page_view', 'visualizacao_produto', 'busca', 'filtro_categoria',
      'adicionar_carrinho', 'remover_carrinho', 'inicio_checkout',
      'etapa_checkout', 'cupom_aplicado', 'pagamento_iniciado',
      'compra', 'login', 'cadastro', 'clique_whatsapp', 'formulario_contato',
    ]).notNull(),

    /**
     * Dados contextuais do evento em JSON.
     * Estrutura varia por tipo:
     *   visualizacao_produto: { produto_id, nome, categoria_id, preco }
     *   adicionar_carrinho:   { produto_id, quantidade, preco }
     *   compra:               { pedido_id, total, qtd_itens, cupom_usado }
     *   busca:                { termo, qtd_resultados }
     */
    payload: json('payload'),

    /** URL da página onde o evento ocorreu */
    urlPagina: varchar('page_url', { length: 500 }),

    /** Data e hora do evento */
    criadoEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    sessaoTipoIdx: index('analytics_events_session_type_idx').on(tabela.sessaoId, tabela.tipoEvento),
    tipoIdx:       index('analytics_events_type_idx').on(tabela.tipoEvento),
    dataIdx:       index('analytics_events_created_at_idx').on(tabela.criadoEm),
  }),
)

// ─── Tabela: analytics_page_views (visualizações) ─────────
export const visualizacoesPagina = mysqlTable(
  'analytics_page_views',
  {
    /** Identificador único da visualização */
    id: int('id').autoincrement().primaryKey(),

    /** Sessão do visitante */
    sessaoId: int('session_id')
      .notNull()
      .references(() => sessoesAnalytics.id),

    /**
     * Produto visualizado.
     * NULL para páginas que não são de produto.
     */
    produtoId: int('product_id').references(() => produtos.id),

    /** URL completa da página visualizada */
    urlPagina: varchar('page_url', { length: 500 }).notNull(),

    /**
     * Tempo de permanência na página em segundos.
     * Calculado pelo frontend ao sair da página.
     * NULL se o visitante saiu sem calcular.
     */
    duracaoSegundos: int('duration_seconds'),

    /** Data e hora da visualização */
    criadoEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    // Índice para queries de "produtos mais vistos" por período
    produtoDataIdx: index('analytics_pv_product_date_idx').on(tabela.produtoId, tabela.criadoEm),
    sessaoIdx:      index('analytics_pv_session_idx').on(tabela.sessaoId),
    dataIdx:        index('analytics_pv_created_at_idx').on(tabela.criadoEm),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const sessoesAnalyticsRelations = relations(sessoesAnalytics, ({ one, many }) => ({
  cliente:       one(clientes, {
    fields:     [sessoesAnalytics.clienteId],
    references: [clientes.id],
  }),
  eventos:       many(eventosAnalytics),
  visualizacoes: many(visualizacoesPagina),
}))

export const eventosAnalyticsRelations = relations(eventosAnalytics, ({ one }) => ({
  sessao: one(sessoesAnalytics, {
    fields:     [eventosAnalytics.sessaoId],
    references: [sessoesAnalytics.id],
  }),
}))

export const visualizacoesPaginaRelations = relations(visualizacoesPagina, ({ one }) => ({
  sessao:  one(sessoesAnalytics, { fields: [visualizacoesPagina.sessaoId], references: [sessoesAnalytics.id] }),
  produto: one(produtos,         { fields: [visualizacoesPagina.produtoId], references: [produtos.id] }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type SessaoAnalytics       = typeof sessoesAnalytics.$inferSelect
export type NovaSessaoAnalytics   = typeof sessoesAnalytics.$inferInsert
export type EventoAnalytics       = typeof eventosAnalytics.$inferSelect
export type NovoEventoAnalytics   = typeof eventosAnalytics.$inferInsert
export type VisualizacaoPagina    = typeof visualizacoesPagina.$inferSelect
