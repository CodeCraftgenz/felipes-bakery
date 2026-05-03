/**
 * Queries de Métricas — Felipe's Bakery
 *
 * Calcula os indicadores exibidos no Dashboard do admin.
 * Todas as queries são otimizadas com agregações SQL para evitar
 * carregar dados brutos no Node.js.
 *
 * Server-only.
 */

import 'server-only'
import { eq, gte, sql, and, desc, ne } from 'drizzle-orm'
import { db }           from '@backend/lib/banco'
import {
  pedidos,
  itensPedido,
  clientes,
  produtos,
} from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export type MetricasDashboard = {
  /** Receita total de pedidos confirmados hoje */
  receitaHoje:         number
  /** Receita do mês corrente */
  receitaMes:          number
  /** Número de pedidos aguardando confirmação/produção */
  pedidosPendentes:    number
  /** Total de pedidos nos últimos 30 dias */
  pedidosUltimos30d:   number
  /** Total de clientes cadastrados */
  totalClientes:       number
  /** Total de produtos ativos */
  totalProdutos:       number
  /** Variação percentual da receita vs. mês anterior */
  variacaoReceita:     number
}

export type PedidoRecente = {
  id:            number
  numeroPedido:  string
  nomeCliente:   string
  total:         string
  status:        string
  criadoEm:      Date
}

export type ProdutoMaisVendido = {
  produtoId:   number
  nome:        string
  totalVendas: number
  receita:     number
}

// ── Funções de Query ──────────────────────────────────────────

/**
 * Calcula todas as métricas do dashboard em paralelo.
 * Usa Promise.all para executar as queries simultaneamente.
 */
export async function buscarMetricasDashboard(): Promise<MetricasDashboard> {
  const agora    = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
  const fimMesAnterior    = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59)
  const inicio30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())

  const [
    receitaHojeRes,
    receitaMesRes,
    receitaMesAnteriorRes,
    pendentesRes,
    pedidos30dRes,
    clientesRes,
    produtosRes,
  ] = await Promise.all([
    // Receita de hoje (pedidos pagos)
    db.select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(pedidos)
      .where(and(
        eq(pedidos.status, 'paid'),
        gte(pedidos.criadoEm, inicioHoje),
      )),

    // Receita do mês atual
    db.select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(pedidos)
      .where(and(
        eq(pedidos.status, 'paid'),
        gte(pedidos.criadoEm, inicioMes),
      )),

    // Receita do mês anterior (para calcular variação)
    db.select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(pedidos)
      .where(and(
        eq(pedidos.status, 'paid'),
        gte(pedidos.criadoEm, inicioMesAnterior),
        sql`${pedidos.criadoEm} <= ${fimMesAnterior}`,
      )),

    // Pedidos pendentes (aguardando pagamento ou em produção)
    db.select({ total: sql<number>`COUNT(*)` })
      .from(pedidos)
      .where(sql`${pedidos.status} IN ('pending_payment', 'paid', 'in_production')`),

    // Total de pedidos nos últimos 30 dias
    db.select({ total: sql<number>`COUNT(*)` })
      .from(pedidos)
      .where(and(
        gte(pedidos.criadoEm, inicio30d),
        ne(pedidos.status, 'cancelled'),
      )),

    // Total de clientes cadastrados
    db.select({ total: sql<number>`COUNT(*)` })
      .from(clientes)
      .where(eq(clientes.ativo, 1)),

    // Total de produtos publicados
    db.select({ total: sql<number>`COUNT(*)` })
      .from(produtos)
      .where(and(eq(produtos.status, 'published'), eq(produtos.ativo, 1))),
  ])

  const receitaMesVal         = Number(receitaMesRes[0]?.total ?? 0)
  const receitaMesAnteriorVal = Number(receitaMesAnteriorRes[0]?.total ?? 0)

  // Variação percentual (evita divisão por zero)
  const variacaoReceita = receitaMesAnteriorVal === 0
    ? 100
    : Math.round(((receitaMesVal - receitaMesAnteriorVal) / receitaMesAnteriorVal) * 100)

  return {
    receitaHoje:       Number(receitaHojeRes[0]?.total ?? 0),
    receitaMes:        receitaMesVal,
    pedidosPendentes:  Number(pendentesRes[0]?.total ?? 0),
    pedidosUltimos30d: Number(pedidos30dRes[0]?.total ?? 0),
    totalClientes:     Number(clientesRes[0]?.total ?? 0),
    totalProdutos:     Number(produtosRes[0]?.total ?? 0),
    variacaoReceita,
  }
}

/**
 * Retorna os N pedidos mais recentes para o widget do dashboard.
 */
export async function buscarPedidosRecentes(limite = 8): Promise<PedidoRecente[]> {
  const rows = await db
    .select({
      id:           pedidos.id,
      numeroPedido: pedidos.numeroPedido,
      entregaNome:  pedidos.entregaNome,
      nomeCliente:  clientes.nome,
      total:        pedidos.total,
      status:       pedidos.status,
      criadoEm:     pedidos.criadoEm,
    })
    .from(pedidos)
    .leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
    .orderBy(desc(pedidos.criadoEm))
    .limit(limite)

  return rows.map((r) => ({
    id:           r.id,
    numeroPedido: r.numeroPedido,
    nomeCliente:  r.nomeCliente ?? r.entregaNome ?? 'Cliente',
    total:        r.total,
    status:       r.status,
    criadoEm:     r.criadoEm,
  }))
}

/**
 * Retorna os produtos mais vendidos por quantidade nos últimos 30 dias.
 */
export async function buscarProdutosMaisVendidos(limite = 5): Promise<ProdutoMaisVendido[]> {
  const inicio30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const resultado = await db
    .select({
      produtoId:   itensPedido.produtoId,
      nome:        produtos.nome,
      totalVendas: sql<number>`SUM(${itensPedido.quantidade})`,
      receita:     sql<number>`SUM(CAST(${itensPedido.subtotal} AS DECIMAL(10,2)))`,
    })
    .from(itensPedido)
    .leftJoin(produtos, eq(itensPedido.produtoId, produtos.id))
    .leftJoin(pedidos, eq(itensPedido.pedidoId, pedidos.id))
    .where(and(
      gte(pedidos.criadoEm, inicio30d),
      ne(pedidos.status, 'cancelled'),
    ))
    .groupBy(itensPedido.produtoId, produtos.nome)
    .orderBy(sql`SUM(${itensPedido.quantidade}) DESC`)
    .limit(limite)

  return resultado.map((r) => ({
    produtoId:   r.produtoId ?? 0,
    nome:        r.nome ?? 'Produto',
    totalVendas: Number(r.totalVendas),
    receita:     Number(r.receita),
  }))
}
