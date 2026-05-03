/**
 * Schema: Categorias de Produtos (tabela `categories`)
 *
 * Organiza os produtos do cardápio da Felipe's Bakery em grupos.
 *
 * Categorias iniciais do cardápio:
 *   - Pães Rústicos     → pães de fermentação natural
 *   - Semi-Integral     → pães com farinha semi-integral
 *   - Folhado Artesanal → croissants e folhados
 *
 * displayOrder controla a ordem de exibição no site.
 * Soft delete via deletedAt para preservar histórico de pedidos.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  tinyint,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

// ─── Tabela: categories (categorias) ─────────────────────
export const categorias = mysqlTable(
  'categories',
  {
    /** Identificador único da categoria */
    id: int('id').autoincrement().primaryKey(),

    /** Nome exibido no site (ex: "Pães Rústicos") */
    nome: varchar('name', { length: 100 }).notNull(),

    /**
     * Slug para a URL da categoria.
     * Gerado automaticamente a partir do nome.
     * Exemplo: "Pães Rústicos" → "paes-rusticos"
     */
    slug: varchar('slug', { length: 100 }).notNull().unique(),

    /** Descrição breve exibida na página da categoria */
    descricao: text('description'),

    /** URL da imagem de capa da categoria (armazenada no R2) */
    urlImagem: varchar('image_url', { length: 500 }),

    /**
     * Ordem de exibição no site.
     * Categorias são ordenadas pelo valor crescente desta coluna.
     */
    ordemExibicao: int('display_order').notNull().default(0),

    /** Se a categoria está visível no site */
    ativa: tinyint('is_active').notNull().default(1),

    /**
     * Soft delete — quando preenchido, a categoria foi removida.
     * Produtos desta categoria ainda aparecem em pedidos antigos.
     */
    excluidaEm: timestamp('deleted_at'),

    /** Data de criação */
    criadaEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadaEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    slugIdx:      uniqueIndex('categories_slug_idx').on(tabela.slug),
    ativaIdx:     index('categories_is_active_idx').on(tabela.ativa),
    ordemIdx:     index('categories_display_order_idx').on(tabela.ordemExibicao),
    excluidaIdx:  index('categories_deleted_at_idx').on(tabela.excluidaEm),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
// Produtos desta categoria — definido no schema de produtos
export const categoriasRelations = relations(categorias, ({ many }) => ({
  produtos: many({} as any), // referência completada no index
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Categoria    = typeof categorias.$inferSelect
export type NovaCategoria = typeof categorias.$inferInsert
