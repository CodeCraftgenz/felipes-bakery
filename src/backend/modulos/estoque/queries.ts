/**
 * Queries de Estoque — Felipe's Bakery
 *
 * Consultas do painel admin para controle de estoque.
 * Server-only.
 */

import 'server-only'
import { eq, asc, lte, sql } from 'drizzle-orm'
import { db }                from '@backend/lib/banco'
import { estoque, produtos, movimentacoesEstoque, usuarios } from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export type ItemEstoque = {
  produtoId:    number
  nomeProduto:  string
  slugProduto:  string
  quantidade:   number
  alertaMinimo: number
  /** true se a quantidade está abaixo ou igual ao alerta mínimo */
  emAlerta:     boolean
}

export type MovimentacaoEstoque = {
  id:          number
  tipo:        string
  /** Variação (positivo para entrada, negativo para saída/redução) */
  quantidade:  number
  motivo:      string | null
  nomeUsuario: string | null
  criadoEm:    Date
}

// ── Funções ───────────────────────────────────────────────────

/**
 * Lista o estoque de todos os produtos ativos com status de alerta.
 * Ordenado: produtos em alerta primeiro, depois por nome.
 */
export async function listarEstoque(): Promise<ItemEstoque[]> {
  const resultado = await db
    .select({
      produtoId:    estoque.produtoId,
      nomeProduto:  produtos.nome,
      slugProduto:  produtos.slug,
      quantidade:   estoque.quantidade,
      alertaMinimo: estoque.alertaMinimo,
    })
    .from(estoque)
    .leftJoin(produtos, eq(estoque.produtoId, produtos.id))
    .where(eq(produtos.ativo, 1))
    .orderBy(asc(produtos.nome))

  return resultado.map((r) => ({
    produtoId:    r.produtoId,
    nomeProduto:  r.nomeProduto ?? 'Produto',
    slugProduto:  r.slugProduto ?? '',
    quantidade:   r.quantidade,
    alertaMinimo: r.alertaMinimo,
    emAlerta:     r.quantidade <= r.alertaMinimo,
  }))
}

/**
 * Retorna apenas os produtos com estoque em alerta (abaixo do mínimo).
 * Usado no widget de alertas do dashboard.
 */
export async function buscarProdutosEmAlerta(): Promise<ItemEstoque[]> {
  const todos = await listarEstoque()
  return todos.filter((i) => i.emAlerta)
}

/**
 * Retorna o histórico de movimentações de um produto.
 *
 * @param produtoId - ID do produto
 * @param limite    - Número máximo de registros
 */
export async function buscarHistoricoEstoque(
  produtoId: number,
  limite = 20,
): Promise<MovimentacaoEstoque[]> {
  const resultado = await db
    .select({
      id:          movimentacoesEstoque.id,
      tipo:        movimentacoesEstoque.tipo,
      quantidade:  movimentacoesEstoque.quantidade,
      motivo:      movimentacoesEstoque.motivo,
      nomeUsuario: usuarios.nome,
      criadoEm:    movimentacoesEstoque.criadoEm,
    })
    .from(movimentacoesEstoque)
    .leftJoin(usuarios, eq(movimentacoesEstoque.usuarioId, usuarios.id))
    .where(eq(movimentacoesEstoque.produtoId, produtoId))
    .orderBy(sql`${movimentacoesEstoque.criadoEm} DESC`)
    .limit(limite)

  return resultado.map((r) => ({
    id:          r.id,
    tipo:        r.tipo,
    quantidade:  r.quantidade,
    motivo:      r.motivo,
    nomeUsuario: r.nomeUsuario,
    criadoEm:    r.criadoEm,
  }))
}
