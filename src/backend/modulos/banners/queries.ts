/**
 * Queries de Banners — Felipe's Bakery
 *
 * Busca banners ativos para exibição na home.
 * Server-only.
 */

import 'server-only'
import { eq, asc, desc } from 'drizzle-orm'
import { db }      from '@backend/lib/banco'
import { banners } from '@schema'

export type BannerResumo = {
  id:        number
  titulo:    string
  urlImagem: string
  urlLink:   string | null
}

/**
 * Retorna todos os banners ativos ordenados por posição.
 */
export async function buscarBanners(): Promise<BannerResumo[]> {
  return db
    .select({
      id:        banners.id,
      titulo:    banners.titulo,
      urlImagem: banners.urlImagem,
      urlLink:   banners.urlLink,
    })
    .from(banners)
    .where(eq(banners.ativo, 1))
    .orderBy(asc(banners.ordemExibicao))
}

/**
 * Lista TODOS os banners (ativos e inativos) para o painel admin.
 */
export async function listarBanners() {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.ordemExibicao), desc(banners.criadoEm))
}
