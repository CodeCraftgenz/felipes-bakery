/**
 * Mutations de Categorias — Felipe's Bakery
 *
 * Operações de criação, edição e remoção de categorias.
 * Server-only.
 */

import 'server-only'
import { eq }  from 'drizzle-orm'
import { db }  from '@backend/lib/banco'
import { categorias } from '@schema'
import { slugificar } from '@compartilhado/utils'

export interface CriarCategoriaInput {
  nome:          string
  descricao?:    string | null
  ordemExibicao?: number
}

/**
 * Cria uma nova categoria com slug gerado automaticamente.
 */
export async function criarCategoria(dados: CriarCategoriaInput) {
  const slug = slugificar(dados.nome)

  const [inserido] = await db.insert(categorias).values({
    ...dados,
    slug,
    ativa:         1,
    ordemExibicao: dados.ordemExibicao ?? 99,
  })

  return { id: (inserido as any).insertId as number, slug }
}

/**
 * Atualiza nome, descrição e/ou ordem de exibição de uma categoria.
 * Regenera o slug se o nome foi alterado.
 */
export async function editarCategoria(
  id: number,
  dados: Partial<CriarCategoriaInput>,
) {
  const atualizacoes: Record<string, unknown> = { ...dados }
  if (dados.nome) atualizacoes.slug = slugificar(dados.nome)

  await db
    .update(categorias)
    .set(atualizacoes)
    .where(eq(categorias.id, id))
}

/**
 * Desativa uma categoria (soft delete).
 * Não remove do banco — produtos vinculados são preservados.
 */
export async function desativarCategoria(id: number) {
  await db
    .update(categorias)
    .set({ ativa: 0 })
    .where(eq(categorias.id, id))
}
