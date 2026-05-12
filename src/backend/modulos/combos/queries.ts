/**
 * Queries de Combos Sazonais — Felipe's Bakery
 *
 * Lê os combos para admin e site público.
 * Server-only.
 */

import 'server-only'
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { db }       from '@backend/lib/banco'
import { combos, itensCombo, produtos } from '@schema'

// ── Tipos de retorno ──────────────────────────────────────────

export type ProdutoDoCombo = {
  produtoId:  number
  nome:       string
  slug:       string
  quantidade: number
  ordem:      number
  urlImagem:  string | null
}

export type ComboCompleto = {
  id:             number
  slug:           string
  nome:           string
  descricao:      string | null
  preco:          string
  precoOriginal:  string | null
  urlImagem:      string | null
  tema:           string
  destacarHome:   number
  ativo:          number
  validoDesde:    Date | null
  validoAte:      Date | null
  itens:          ProdutoDoCombo[]
}

// ── Funções ───────────────────────────────────────────────────

/**
 * Lista todos os combos (admin) com seus itens.
 * Ordena por destaque desc, depois por nome.
 */
export async function listarCombosAdmin(): Promise<ComboCompleto[]> {
  const linhasCombos = await db
    .select()
    .from(combos)
    .orderBy(desc(combos.destacarHome), asc(combos.nome))

  return Promise.all(linhasCombos.map(async (c) => ({
    id:            c.id,
    slug:          c.slug,
    nome:          c.nome,
    descricao:     c.descricao,
    preco:         c.preco,
    precoOriginal: c.precoOriginal,
    urlImagem:     c.urlImagem,
    tema:          c.tema,
    destacarHome:  c.destacarHome,
    ativo:         c.ativo,
    validoDesde:   c.validoDesde,
    validoAte:     c.validoAte,
    itens:         await buscarItensDoCombo(c.id),
  })))
}

/**
 * Lista combos ativos e dentro da validade para exibir no site público.
 * Filtra por destacarHome = 1 e janela temporal.
 */
export async function listarCombosPublicos(): Promise<ComboCompleto[]> {
  const agora = new Date()

  const linhasCombos = await db
    .select()
    .from(combos)
    .where(and(
      eq(combos.ativo, 1),
      eq(combos.destacarHome, 1),
      or(isNull(combos.validoDesde), lte(combos.validoDesde, agora)),
      or(isNull(combos.validoAte),   gte(combos.validoAte,   agora)),
    ))
    .orderBy(desc(combos.validoDesde))

  return Promise.all(linhasCombos.map(async (c) => ({
    id:            c.id,
    slug:          c.slug,
    nome:          c.nome,
    descricao:     c.descricao,
    preco:         c.preco,
    precoOriginal: c.precoOriginal,
    urlImagem:     c.urlImagem,
    tema:          c.tema,
    destacarHome:  c.destacarHome,
    ativo:         c.ativo,
    validoDesde:   c.validoDesde,
    validoAte:     c.validoAte,
    itens:         await buscarItensDoCombo(c.id),
  })))
}

/**
 * Busca um combo específico pelo slug (qualquer status).
 */
export async function buscarComboPorSlug(slug: string): Promise<ComboCompleto | null> {
  const [combo] = await db
    .select()
    .from(combos)
    .where(eq(combos.slug, slug))
    .limit(1)

  if (!combo) return null

  return {
    id:            combo.id,
    slug:          combo.slug,
    nome:          combo.nome,
    descricao:     combo.descricao,
    preco:         combo.preco,
    precoOriginal: combo.precoOriginal,
    urlImagem:     combo.urlImagem,
    tema:          combo.tema,
    destacarHome:  combo.destacarHome,
    ativo:         combo.ativo,
    validoDesde:   combo.validoDesde,
    validoAte:     combo.validoAte,
    itens:         await buscarItensDoCombo(combo.id),
  }
}

/**
 * Retorna os produtos que compõem um combo, com nome e imagem de capa.
 */
async function buscarItensDoCombo(comboId: number): Promise<ProdutoDoCombo[]> {
  const linhas = await db
    .select({
      produtoId:  itensCombo.produtoId,
      quantidade: itensCombo.quantidade,
      ordem:      itensCombo.ordem,
      nome:       produtos.nome,
      slug:       produtos.slug,
      // imagem de capa via subquery simples
      urlImagem:  sql<string | null>`(
        SELECT url FROM product_images
        WHERE product_id = ${itensCombo.produtoId}
        ORDER BY display_order ASC LIMIT 1
      )`,
    })
    .from(itensCombo)
    .innerJoin(produtos, eq(itensCombo.produtoId, produtos.id))
    .where(eq(itensCombo.comboId, comboId))
    .orderBy(asc(itensCombo.ordem))

  return linhas.map((l) => ({
    produtoId:  l.produtoId,
    nome:       l.nome,
    slug:       l.slug,
    quantidade: l.quantidade,
    ordem:      l.ordem,
    urlImagem:  l.urlImagem ?? null,
  }))
}
