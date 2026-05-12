/**
 * Queries de Relatórios — Felipe's Bakery
 *
 * Queries agregadas para a página /admin/relatorios:
 *   - Séries temporais (receita diária e mensal)
 *   - Resumo de vendas por período (total, ticket médio, qtd pedidos)
 *   - Top clientes por valor gasto
 *   - Produtos com estoque crítico
 *
 * Todas as queries usam agregações SQL e respeitam o status do pedido
 * (não conta cancelados, considera apenas pagos para receita).
 *
 * Server-only.
 */

import 'server-only'
import { and, desc, eq, gte, lte, ne, sql } from 'drizzle-orm'
import { db }      from '@backend/lib/banco'
import {
  pedidos,
  itensPedido,
  clientes,
  produtos,
  estoque,
} from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export type SerieReceita = {
  /** Data do ponto (YYYY-MM-DD para diário, YYYY-MM para mensal) */
  periodo:    string
  /** Receita total daquele período (em R$) */
  receita:    number
  /** Quantidade de pedidos pagos */
  pedidos:    number
}

export type ResumoVendas = {
  /** Receita total no período (R$) — apenas pedidos pagos */
  receitaTotal:  number
  /** Quantidade de pedidos pagos */
  totalPedidos:  number
  /** Receita / total de pedidos (R$) */
  ticketMedio:   number
  /** Unidades de produto vendidas */
  unidadesVendidas: number
}

export type TopCliente = {
  clienteId:    number
  nome:         string
  email:        string
  totalPedidos: number
  valorTotal:   number
}

export type EstoqueCritico = {
  produtoId:    number
  nome:         string
  slug:         string
  quantidade:   number
  alertaMinimo: number
}

// ── Helpers de período ────────────────────────────────────────
function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

// ── Queries ───────────────────────────────────────────────────

/**
 * Receita e pedidos pagos por dia nos últimos N dias.
 * Retorna 1 ponto por dia (mesmo dias sem vendas → receita 0).
 */
export async function serieReceitaDiaria(diasAtras = 30): Promise<SerieReceita[]> {
  const inicio = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)
  inicio.setHours(0, 0, 0, 0)

  const linhas = await db
    .select({
      periodo: sql<string>`DATE(${pedidos.criadoEm})`,
      receita: sql<number>`COALESCE(SUM(${pedidos.total}), 0)`,
      pedidos: sql<number>`COUNT(*)`,
    })
    .from(pedidos)
    .where(and(eq(pedidos.status, 'paid'), gte(pedidos.criadoEm, inicio)))
    .groupBy(sql`DATE(${pedidos.criadoEm})`)
    .orderBy(sql`DATE(${pedidos.criadoEm})`)

  // Preenche os dias sem vendas com zero para o gráfico ficar contínuo
  const mapa = new Map<string, SerieReceita>(
    linhas.map((l) => [
      l.periodo,
      { periodo: l.periodo, receita: Number(l.receita), pedidos: Number(l.pedidos) },
    ]),
  )

  const serie: SerieReceita[] = []
  for (let i = diasAtras; i >= 0; i--) {
    const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const iso = d.toISOString().slice(0, 10) // YYYY-MM-DD
    serie.push(mapa.get(iso) ?? { periodo: iso, receita: 0, pedidos: 0 })
  }
  return serie
}

/**
 * Receita e pedidos pagos por mês nos últimos N meses.
 */
export async function serieReceitaMensal(mesesAtras = 12): Promise<SerieReceita[]> {
  const inicio = new Date()
  inicio.setMonth(inicio.getMonth() - mesesAtras)
  inicio.setDate(1)
  inicio.setHours(0, 0, 0, 0)

  const linhas = await db
    .select({
      periodo: sql<string>`DATE_FORMAT(${pedidos.criadoEm}, '%Y-%m')`,
      receita: sql<number>`COALESCE(SUM(${pedidos.total}), 0)`,
      pedidos: sql<number>`COUNT(*)`,
    })
    .from(pedidos)
    .where(and(eq(pedidos.status, 'paid'), gte(pedidos.criadoEm, inicio)))
    .groupBy(sql`DATE_FORMAT(${pedidos.criadoEm}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${pedidos.criadoEm}, '%Y-%m')`)

  const mapa = new Map<string, SerieReceita>(
    linhas.map((l) => [
      l.periodo,
      { periodo: l.periodo, receita: Number(l.receita), pedidos: Number(l.pedidos) },
    ]),
  )

  const serie: SerieReceita[] = []
  for (let i = mesesAtras; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    serie.push(mapa.get(chave) ?? { periodo: chave, receita: 0, pedidos: 0 })
  }
  return serie
}

/**
 * Resumo de vendas para um intervalo de datas.
 * Se o intervalo não é informado, usa os últimos 30 dias.
 */
export async function resumoVendasPeriodo(
  inicio?: Date,
  fim?:    Date,
): Promise<ResumoVendas> {
  const inicioReal = inicio ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const fimReal    = fim    ?? new Date()

  const [resumo, unidades] = await Promise.all([
    db.select({
      receitaTotal: sql<number>`COALESCE(SUM(${pedidos.total}), 0)`,
      totalPedidos: sql<number>`COUNT(*)`,
    })
    .from(pedidos)
    .where(and(
      eq(pedidos.status, 'paid'),
      gte(pedidos.criadoEm, inicioReal),
      lte(pedidos.criadoEm, fimReal),
    )),

    db.select({
      unidades: sql<number>`COALESCE(SUM(${itensPedido.quantidade}), 0)`,
    })
    .from(itensPedido)
    .leftJoin(pedidos, eq(itensPedido.pedidoId, pedidos.id))
    .where(and(
      eq(pedidos.status, 'paid'),
      gte(pedidos.criadoEm, inicioReal),
      lte(pedidos.criadoEm, fimReal),
    )),
  ])

  const receita = Number(resumo[0]?.receitaTotal ?? 0)
  const qtd     = Number(resumo[0]?.totalPedidos ?? 0)

  return {
    receitaTotal:     receita,
    totalPedidos:     qtd,
    ticketMedio:      qtd > 0 ? receita / qtd : 0,
    unidadesVendidas: Number(unidades[0]?.unidades ?? 0),
  }
}

/**
 * Top N clientes por valor total gasto (apenas pedidos pagos).
 */
export async function topClientesPorValor(limite = 10): Promise<TopCliente[]> {
  const linhas = await db
    .select({
      clienteId:    clientes.id,
      nome:         clientes.nome,
      email:        clientes.email,
      totalPedidos: sql<number>`COUNT(${pedidos.id})`,
      valorTotal:   sql<number>`COALESCE(SUM(${pedidos.total}), 0)`,
    })
    .from(clientes)
    .innerJoin(pedidos, and(
      eq(pedidos.clienteId, clientes.id),
      eq(pedidos.status, 'paid'),
    ))
    .groupBy(clientes.id, clientes.nome, clientes.email)
    .orderBy(desc(sql`SUM(${pedidos.total})`))
    .limit(limite)

  return linhas.map((l) => ({
    clienteId:    l.clienteId,
    nome:         l.nome,
    email:        l.email,
    totalPedidos: Number(l.totalPedidos),
    valorTotal:   Number(l.valorTotal),
  }))
}

/**
 * Produtos com estoque crítico (quantidade <= alertaMinimo).
 */
export async function produtosEstoqueCritico(): Promise<EstoqueCritico[]> {
  const linhas = await db
    .select({
      produtoId:    produtos.id,
      nome:         produtos.nome,
      slug:         produtos.slug,
      quantidade:   estoque.quantidade,
      alertaMinimo: estoque.alertaMinimo,
    })
    .from(estoque)
    .innerJoin(produtos, eq(estoque.produtoId, produtos.id))
    .where(and(
      sql`${estoque.quantidade} <= ${estoque.alertaMinimo}`,
      eq(produtos.ativo, 1),
      ne(produtos.status, 'archived'),
    ))
    .orderBy(estoque.quantidade)

  return linhas.map((l) => ({
    produtoId:    l.produtoId,
    nome:         l.nome,
    slug:         l.slug,
    quantidade:   Number(l.quantidade),
    alertaMinimo: Number(l.alertaMinimo),
  }))
}
