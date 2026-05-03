/**
 * Queries de Categorias — Felipe's Bakery
 *
 * Funções de leitura do banco para o módulo de categorias.
 * Server-only — não importar em Client Components.
 */

import 'server-only'
import { eq, asc } from 'drizzle-orm'
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
