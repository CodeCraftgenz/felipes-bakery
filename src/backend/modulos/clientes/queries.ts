/**
 * Queries de Clientes — Felipe's Bakery
 *
 * Consultas para o painel admin de clientes.
 * Server-only.
 */

import 'server-only'
import { eq, desc, like, or, sql, and } from 'drizzle-orm'
import { db }      from '@backend/lib/banco'
import { clientes } from '@schema'
import type { ResultadoPaginado } from '@backend/modulos/pedidos/admin-queries'

export type ClienteLista = {
  id:          number
  nome:        string
  email:       string
  telefone:    string | null
  totalPedidos: number
  totalGasto:  number
  criadoEm:    Date
}

/**
 * Lista clientes com busca e paginação.
 */
export async function listarClientes(
  busca?: string,
  pagina = 1,
  porPagina = 20,
): Promise<ResultadoPaginado<ClienteLista>> {
  const offset = (pagina - 1) * porPagina
  const where  = busca
    ? and(
        eq(clientes.ativo, 1),
        or(like(clientes.nome, `%${busca}%`), like(clientes.email, `%${busca}%`)),
      )
    : eq(clientes.ativo, 1)

  const [countRes, itens] = await Promise.all([
    db.select({ total: sql<number>`COUNT(*)` }).from(clientes).where(where),
    db
      .select({
        id:          clientes.id,
        nome:        clientes.nome,
        email:       clientes.email,
        telefone:    clientes.telefone,
        totalPedidos: sql<number>`(SELECT COUNT(*) FROM orders p WHERE p.customer_id = ${clientes.id})`,
        totalGasto:   sql<number>`(SELECT COALESCE(SUM(p.total), 0) FROM orders p WHERE p.customer_id = ${clientes.id} AND p.status = 'paid')`,
        criadoEm:    clientes.criadoEm,
      })
      .from(clientes)
      .where(where)
      .orderBy(desc(clientes.criadoEm))
      .limit(porPagina)
      .offset(offset),
  ])

  const total = Number(countRes[0]?.total ?? 0)
  return {
    itens: itens.map((i) => ({ ...i, totalPedidos: Number(i.totalPedidos), totalGasto: Number(i.totalGasto) })),
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  }
}
