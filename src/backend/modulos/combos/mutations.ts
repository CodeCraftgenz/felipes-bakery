/**
 * Mutations de Combos Sazonais — Felipe's Bakery
 *
 * Operações de escrita para combos (criação, edição, ativação, remoção).
 * Server-only.
 */

import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { db }      from '@backend/lib/banco'
import { combos, itensCombo } from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export interface ItemComboInput {
  produtoId:  number
  quantidade: number
  ordem?:     number
}

export interface CriarComboInput {
  slug:           string
  nome:           string
  descricao?:     string | null
  preco:          string
  precoOriginal?: string | null
  urlImagem?:     string | null
  tema?:          string
  destacarHome?:  0 | 1
  ativo?:         0 | 1
  validoDesde?:   Date | null
  validoAte?:     Date | null
  itens:          ItemComboInput[]
}

export type EditarComboInput = Partial<Omit<CriarComboInput, 'itens'>> & {
  itens?: ItemComboInput[]
}

// ── Funções ───────────────────────────────────────────────────

/**
 * Cria um combo + seus itens em uma única transação.
 */
export async function criarCombo(dados: CriarComboInput): Promise<number> {
  if (dados.itens.length === 0) {
    throw new Error('Combo deve ter ao menos 1 produto.')
  }

  const [inserido] = await db.insert(combos).values({
    slug:          dados.slug.toLowerCase().trim(),
    nome:          dados.nome,
    descricao:     dados.descricao     ?? null,
    preco:         dados.preco,
    precoOriginal: dados.precoOriginal ?? null,
    urlImagem:     dados.urlImagem     ?? null,
    tema:          dados.tema          ?? 'geral',
    destacarHome:  dados.destacarHome  ?? 1,
    ativo:         dados.ativo         ?? 1,
    validoDesde:   dados.validoDesde   ?? null,
    validoAte:     dados.validoAte     ?? null,
  })

  const comboId = (inserido as any).insertId as number

  await db.insert(itensCombo).values(
    dados.itens.map((item, idx) => ({
      comboId,
      produtoId:  item.produtoId,
      quantidade: item.quantidade,
      ordem:      item.ordem ?? idx,
    })),
  )

  return comboId
}

/**
 * Atualiza dados de um combo.
 * Se `itens` for informado, recria a lista completa de produtos.
 */
export async function atualizarCombo(id: number, dados: EditarComboInput): Promise<void> {
  const { itens, ...campos } = dados
  const atualizacoes: Record<string, unknown> = { ...campos }
  if (typeof campos.slug === 'string') {
    atualizacoes.slug = campos.slug.toLowerCase().trim()
  }

  if (Object.keys(atualizacoes).length > 0) {
    await db.update(combos).set(atualizacoes).where(eq(combos.id, id))
  }

  if (itens) {
    if (itens.length === 0) {
      throw new Error('Combo deve ter ao menos 1 produto.')
    }
    await db.delete(itensCombo).where(eq(itensCombo.comboId, id))
    await db.insert(itensCombo).values(
      itens.map((item, idx) => ({
        comboId:    id,
        produtoId:  item.produtoId,
        quantidade: item.quantidade,
        ordem:      item.ordem ?? idx,
      })),
    )
  }
}

/**
 * Alterna o flag de ativo do combo (atalho).
 */
export async function alternarAtivoCombo(id: number): Promise<void> {
  await db
    .update(combos)
    .set({ ativo: sql`1 - ${combos.ativo}` })
    .where(eq(combos.id, id))
}

/**
 * Remove um combo (cascade apaga os itens).
 */
export async function deletarCombo(id: number): Promise<void> {
  await db.delete(combos).where(eq(combos.id, id))
}
