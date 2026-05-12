/**
 * Queries de Categorias — Felipe's Bakery
 *
 * Funções de leitura do banco para o módulo de categorias.
 * Server-only — não importar em Client Components.
 */

import 'server-only'
import { eq, asc, sql } from 'drizzle-orm'
import { db }      from '@backend/lib/banco'
import { categorias } from '@schema'

// ── Tipo de Retorno ───────────────────────────────────────────

export type CategoriaResumo = {
  id:           number
  nome:         string
  slug:         string
  descricao:    string | null
  ordemExibicao: number
}

export type CategoriaComContagem = CategoriaResumo & {
  totalProdutos: number
}

// ── Funções de Query ──────────────────────────────────────────

/**
 * Busca todas as categorias ativas ordenadas pela ordem de exibição.
 * Usada nos filtros do catálogo e no menu de navegação.
 */
export async function buscarCategorias(): Promise<CategoriaResumo[]> {
  return db
    .select({
      id:           categorias.id,
      nome:         categorias.nome,
      slug:         categorias.slug,
      descricao:    categorias.descricao,
      ordemExibicao: categorias.ordemExibicao,
    })
    .from(categorias)
    .where(eq(categorias.ativa, 1))
    .orderBy(asc(categorias.ordemExibicao))
}

/**
 * Lista categorias com contagem de produtos publicados em cada uma.
 * Usada na página /admin/categorias para o admin ver rapidamente
 * quantos itens já estão classificados em cada categoria.
 */
export async function listarCategoriasComContagem(): Promise<CategoriaComContagem[]> {
  const linhas = await db
    .select({
      id:            categorias.id,
      nome:          categorias.nome,
      slug:          categorias.slug,
      descricao:     categorias.descricao,
      ordemExibicao: categorias.ordemExibicao,
      totalProdutos: sql<number>`(
        SELECT COUNT(*) FROM products
        WHERE products.category_id = ${categorias.id}
          AND products.is_active = 1
          AND products.status != 'archived'
      )`,
    })
    .from(categorias)
    .where(eq(categorias.ativa, 1))
    .orderBy(asc(categorias.ordemExibicao))

  return linhas.map((l) => ({
    ...l,
    totalProdutos: Number(l.totalProdutos),
  }))
}

/**
 * Busca uma categoria pelo slug.
 * Retorna null se não encontrada ou inativa.
 */
export async function buscarCategoriaPorSlug(slug: string): Promise<CategoriaResumo | null> {
  const [categoria] = await db
    .select({
      id:           categorias.id,
      nome:         categorias.nome,
      slug:         categorias.slug,
      descricao:    categorias.descricao,
      ordemExibicao: categorias.ordemExibicao,
    })
    .from(categorias)
    .where(eq(categorias.slug, slug))
    .limit(1)

  return categoria ?? null
}
