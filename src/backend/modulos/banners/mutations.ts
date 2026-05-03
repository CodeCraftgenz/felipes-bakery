/**
 * Mutations de Banners — Felipe's Bakery
 *
 * Operações de escrita para o módulo de banners do site público.
 * Server-only.
 */

import 'server-only'
import { eq, sql }   from 'drizzle-orm'
import { db }        from '@backend/lib/banco'
import { banners }   from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export interface CriarBannerInput {
  titulo:        string
  urlImagem:     string
  urlLink?:      string | null
  ordemExibicao?: number
  ativo?:        0 | 1
  validoDesde?:  Date | null
  validoAte?:    Date | null
}

export type EditarBannerInput = Partial<CriarBannerInput>

// ── Funções ───────────────────────────────────────────────────

/**
 * Cria um novo banner.
 */
export async function criarBanner(dados: CriarBannerInput) {
  const [inserido] = await db.insert(banners).values({
    titulo:        dados.titulo,
    urlImagem:     dados.urlImagem,
    urlLink:       dados.urlLink ?? null,
    ordemExibicao: dados.ordemExibicao ?? 0,
    ativo:         dados.ativo ?? 1,
    validoDesde:   dados.validoDesde ?? null,
    validoAte:     dados.validoAte ?? null,
  })

  return { id: (inserido as any).insertId as number }
}

/**
 * Atualiza um banner existente.
 */
export async function atualizarBanner(id: number, dados: EditarBannerInput) {
  await db
    .update(banners)
    .set(dados as any)
    .where(eq(banners.id, id))
}

/**
 * Alterna o status ativo/inativo do banner.
 */
export async function alternarAtivoBanner(id: number) {
  await db
    .update(banners)
    .set({ ativo: sql`1 - ${banners.ativo}` })
    .where(eq(banners.id, id))
}

/**
 * Remove um banner permanentemente.
 */
export async function deletarBanner(id: number) {
  await db
    .delete(banners)
    .where(eq(banners.id, id))
}
