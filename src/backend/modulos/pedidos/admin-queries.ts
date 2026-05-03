/**
 * Queries de Pedidos para o Admin — Felipe's Bakery
 *
 * Consultas com filtros e paginação para o painel administrativo.
 * Server-only.
 */

import 'server-only'
import { eq, desc, like, and, or, sql } from 'drizzle-orm'
import { db }  from '@backend/lib/banco'
import { pedidos, clientes } from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export type FiltroPedidos = {
  status?:    string
  busca?:     string   // Busca por número do pedido ou nome do cliente
  pagina?:    number
  porPagina?: number
}

export type PedidoListaAdmin = {
  id:           number
  numeroPedido: string
  nomeCliente:  string
  emailCliente: string
  total:        string
  status:       string
  criadoEm:     Date
}

export type ResultadoPaginado<T> = {
  itens:       T[]
  total:       number
  pagina:      number
  totalPaginas: number
}

// ── Funções ───────────────────────────────────────────────────

/**
 * Lista pedidos com filtros e paginação para a tabela do admin.
 */
export async function listarPedidosAdmin(
  filtros: FiltroPedidos = {},
): Promise<ResultadoPaginado<PedidoListaAdmin>> {
  const { status, busca, pagina = 1, porPagina = 20 } = filtros
  const offset = (pagina - 1) * porPagina

  // Monta condições de filtro
  const condicoes = []
  if (status) condicoes.push(eq(pedidos.status, status as any))
  if (busca) {
    condicoes.push(
      or(
        like(pedidos.numeroPedido, `%${busca}%`),
        like(pedidos.entregaNome,  `%${busca}%`),
        like(clientes.email,       `%${busca}%`),
      ),
    )
  }

  const where = condicoes.length > 0 ? and(...condicoes) : undefined

  // Executa count e lista em paralelo
  const [countRes, itens] = await Promise.all([
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(pedidos)
      .where(where),

    db
      .select({
        id:           pedidos.id,
        numeroPedido: pedidos.numeroPedido,
        entregaNome:  pedidos.entregaNome,
        nomeCliente:  clientes.nome,
        emailCliente: clientes.email,
        total:        pedidos.total,
        status:       pedidos.status,
        criadoEm:     pedidos.criadoEm,
      })
      .from(pedidos)
      .leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
      .where(where)
      .orderBy(desc(pedidos.criadoEm))
      .limit(porPagina)
      .offset(offset),
  ])

  const total = Number(countRes[0]?.total ?? 0)

  return {
    itens: itens.map((r) => ({
      ...r,
      nomeCliente:  r.nomeCliente  ?? r.entregaNome ?? 'Cliente',
      emailCliente: r.emailCliente ?? '',
    })),
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  }
}
