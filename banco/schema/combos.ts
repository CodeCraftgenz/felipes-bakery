/**
 * Schema: Combos Sazonais (tabelas `combos` e `combo_items`)
 *
 * Combos promocionais para datas comemorativas (Natal, Páscoa, Dia das Mães).
 * Quando ativos e dentro da validade, são exibidos em destaque na home pública.
 *
 * Regras importantes:
 *   - Um combo agrupa N produtos com quantidades
 *   - O preço promocional é fixo (não calculado dinamicamente)
 *   - O preço original (campo precoOriginal) é exibido riscado, mostrando economia
 *   - Slugs únicos para URL amigável (ex: /combos/natal-2026)
 *   - Soft delete via `ativo = 0` (mantém histórico de combos antigos)
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  tinyint,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { produtos }  from './produtos'

// ─── Tabela: combos ──────────────────────────────────────
export const combos = mysqlTable(
  'combos',
  {
    /** Identificador único */
    id: int('id').autoincrement().primaryKey(),

    /** Slug único para URL pública (ex: 'natal-2026') */
    slug: varchar('slug', { length: 255 }).notNull().unique(),

    /** Nome do combo exibido na vitrine */
    nome: varchar('name', { length: 255 }).notNull(),

    /** Descrição detalhada (texto livre) */
    descricao: text('description'),

    /** Preço final do combo */
    preco: decimal('price', { precision: 10, scale: 2 }).notNull(),

    /**
     * Preço original (somatório sem desconto) para mostrar a economia.
     * NULL = não exibe desconto na vitrine.
     */
    precoOriginal: decimal('original_price', { precision: 10, scale: 2 }),

    /** URL da imagem do combo (banner) */
    urlImagem: varchar('image_url', { length: 500 }),

    /**
     * Tema visual do combo, usado pelo CSS para escolher cores/ícones.
     * Valores sugeridos: 'natal', 'pascoa', 'mae', 'pai', 'namorados', 'geral'.
     */
    tema: varchar('theme', { length: 30 }).notNull().default('geral'),

    /**
     * Destacar na home pública.
     * 1 = aparece no carrossel/banner; 0 = só direto pela URL.
     */
    destacarHome: tinyint('feature_home').notNull().default(1),

    /** Se o combo está ativo (visível e vendável) */
    ativo: tinyint('is_active').notNull().default(1),

    /** Início da validade do combo (NULL = sem início definido) */
    validoDesde: timestamp('valid_from'),

    /** Fim da validade do combo (NULL = sem vencimento) */
    validoAte: timestamp('valid_until'),

    /** Data de criação */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    slugIdx:      uniqueIndex('combos_slug_idx').on(tabela.slug),
    ativoIdx:     index('combos_is_active_idx').on(tabela.ativo),
    validadeIdx:  index('combos_validity_idx').on(tabela.ativo, tabela.validoDesde, tabela.validoAte),
  }),
)

// ─── Tabela: combo_items ─────────────────────────────────
export const itensCombo = mysqlTable(
  'combo_items',
  {
    /** Combo ao qual o item pertence */
    comboId: int('combo_id')
      .notNull()
      .references(() => combos.id, { onDelete: 'cascade' }),

    /** Produto incluído no combo */
    produtoId: int('product_id')
      .notNull()
      .references(() => produtos.id),

    /** Quantidade deste produto no combo */
    quantidade: int('quantity').notNull().default(1),

    /** Ordem de exibição na descrição do combo */
    ordem: int('display_order').notNull().default(0),
  },
  (tabela) => ({
    pk: primaryKey({ columns: [tabela.comboId, tabela.produtoId] }),
  }),
)

// ─── Relacionamentos ─────────────────────────────────────
export const combosRelations = relations(combos, ({ many }) => ({
  itens: many(itensCombo),
}))

export const itensComboRelations = relations(itensCombo, ({ one }) => ({
  combo:   one(combos,   { fields: [itensCombo.comboId],   references: [combos.id] }),
  produto: one(produtos, { fields: [itensCombo.produtoId], references: [produtos.id] }),
}))

// ─── Tipos TypeScript ────────────────────────────────────
export type Combo       = typeof combos.$inferSelect
export type NovoCombo   = typeof combos.$inferInsert
export type ItemCombo   = typeof itensCombo.$inferSelect
export type TemaCombo   = 'natal' | 'pascoa' | 'mae' | 'pai' | 'namorados' | 'geral'
