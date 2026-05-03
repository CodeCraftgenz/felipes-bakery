/**
 * Schema: Produtos e Imagens de Produtos (tabelas `products` e `product_images`)
 *
 * Representa os itens do cardápio da Felipe's Bakery disponíveis para compra.
 *
 * Status do produto:
 *   - published → visível no site, pode ser comprado
 *   - draft     → rascunho, visível apenas no admin
 *   - archived  → arquivado, não aparece mais no site
 *
 * Regras importantes:
 *   - Um produto só aparece no catálogo se: ativo=true E status='published' E deletedAt=NULL
 *   - Produto com estoque zero exibe "Esgotado" e bloqueia o botão de compra
 *   - comparePrice é o preço "de" (riscado) para indicar promoção
 *   - Alteração de preço NÃO afeta pedidos existentes (snapshot em order_items)
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  tinyint,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { categorias } from './categorias'

// ─── Tabela: products (produtos) ──────────────────────────
export const produtos = mysqlTable(
  'products',
  {
    /** Identificador único do produto */
    id: int('id').autoincrement().primaryKey(),

    /** Categoria à qual o produto pertence */
    categoriaId: int('category_id')
      .notNull()
      .references(() => categorias.id),

    /** Nome do produto exibido no site (ex: "Ciabatta com Nozes") */
    nome: varchar('name', { length: 255 }).notNull(),

    /**
     * Slug para a URL do produto.
     * Gerado automaticamente. Exemplo: "ciabatta-com-nozes"
     */
    slug: varchar('slug', { length: 255 }).notNull().unique(),

    /** Descrição detalhada exibida na página do produto */
    descricao: text('description'),

    /**
     * Lista de ingredientes do produto.
     * Exibida na página do produto para transparência.
     */
    ingredientes: text('ingredients'),

    /**
     * Peso do produto em gramas.
     * Exibido como "450g", "600g", etc.
     * NULL para produtos sem peso definido (ex: croissant unitário)
     */
    pesoGramas: int('weight_grams'),

    /** Preço de venda em Reais */
    preco: decimal('price', { precision: 10, scale: 2 }).notNull(),

    /**
     * Preço original (riscado) para indicar desconto.
     * NULL quando não há promoção.
     * Exemplo: preco=25.00, precoComparacao=30.00 → "de R$30 por R$25"
     */
    precoComparacao: decimal('compare_price', { precision: 10, scale: 2 }),

    /** Se o produto está visível no site */
    ativo: tinyint('is_active').notNull().default(1),

    /** Se o produto aparece na seção de destaques da home */
    emDestaque: tinyint('is_featured').notNull().default(0),

    /**
     * Status de publicação do produto:
     *   published → visível e disponível para compra
     *   draft     → rascunho, visível apenas no admin
     *   archived  → arquivado, não aparece mais
     */
    status: mysqlEnum('status', ['published', 'draft', 'archived'])
      .notNull()
      .default('draft'),

    /**
     * Soft delete — quando preenchido, o produto foi removido.
     * Histórico de pedidos com este produto é preservado.
     */
    excluidoEm: timestamp('deleted_at'),

    /** Data de criação */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    // Índice único para lookup por URL
    slugIdx:     uniqueIndex('products_slug_idx').on(tabela.slug),
    // Índice composto para o catálogo público (categoria + ativo + status)
    catalogoIdx: index('products_catalog_idx').on(
      tabela.categoriaId, tabela.ativo, tabela.status
    ),
    // Índice para a seção de destaques da home
    destaqueIdx: index('products_featured_idx').on(tabela.emDestaque, tabela.ativo),
    // Índice para filtrar excluídos
    excluidoIdx: index('products_deleted_at_idx').on(tabela.excluidoEm),
    // Índice para ordenação por preço
    precoIdx:    index('products_price_idx').on(tabela.preco),
  }),
)

// ─── Tabela: product_images (imagens dos produtos) ────────
export const imagensProduto = mysqlTable(
  'product_images',
  {
    /** Identificador único da imagem */
    id: int('id').autoincrement().primaryKey(),

    /** Produto ao qual esta imagem pertence */
    produtoId: int('product_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'cascade' }),

    /**
     * URL completa da imagem armazenada no Cloudflare R2.
     * Formato: https://cdn.felipesbakery.com.br/produtos/slug/imagem.webp
     */
    url: varchar('url', { length: 500 }).notNull(),

    /**
     * Texto alternativo para acessibilidade e SEO.
     * Descreve o conteúdo da imagem.
     */
    textoAlternativo: varchar('alt_text', { length: 255 }),

    /**
     * Ordem de exibição na galeria de fotos do produto.
     * Menor número = exibido primeiro.
     */
    ordemExibicao: int('display_order').notNull().default(0),

    /**
     * Se esta é a imagem principal do produto.
     * Usada nos cards de listagem do catálogo.
     * Apenas uma imagem por produto deve ter isPrimary=true.
     */
    principal: tinyint('is_primary').notNull().default(0),

    /** Data de upload da imagem */
    criadaEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    produtoIdx: index('product_images_product_id_idx').on(tabela.produtoId),
    ordemIdx:   index('product_images_order_idx').on(tabela.produtoId, tabela.ordemExibicao),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const produtosRelations = relations(produtos, ({ one, many }) => ({
  /** Categoria do produto */
  categoria: one(categorias, {
    fields:     [produtos.categoriaId],
    references: [categorias.id],
  }),
  /** Galeria de imagens do produto */
  imagens: many(imagensProduto),
  // estoque, movimentacoesEstoque e itensPedido definidos nos seus próprios schemas
}))

export const imagensProdutoRelations = relations(imagensProduto, ({ one }) => ({
  /** Produto ao qual esta imagem pertence */
  produto: one(produtos, {
    fields:     [imagensProduto.produtoId],
    references: [produtos.id],
  }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Produto          = typeof produtos.$inferSelect
export type NovoProduto      = typeof produtos.$inferInsert
export type ImagemProduto    = typeof imagensProduto.$inferSelect
export type NovaImagemProduto = typeof imagensProduto.$inferInsert
export type StatusProduto    = 'published' | 'draft' | 'archived'

/** Produto completo com imagens e estoque — usado nas páginas de produto */
export type ProdutoCompleto = Produto & {
  imagens: ImagemProduto[]
  estoque?: { quantidade: number; alertaMinimo: number } | null
  categoria?: { nome: string; slug: string } | null
}
