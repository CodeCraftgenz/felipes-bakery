/**
 * Página de Gestão de Pedidos "” Felipe's Bakery Admin
 *
 * Lista paginada com abas de status e busca de texto.
 * Server Component.
 */

import type { Metadata }      from 'next'
import { auth }               from '@backend/lib/auth'
import { redirect }           from 'next/navigation'
import { Suspense }           from 'react'
import { listarPedidosAdmin } from '@backend/modulos/pedidos/admin-queries'
import { TabelaPedidos }      from '@frontend/admin/pedidos/TabelaPedidos'
import { FiltrosPedidos }     from '@frontend/admin/pedidos/FiltrosPedidos'
import { Paginacao }          from '@frontend/admin/compartilhado/Paginacao'

export const metadata: Metadata = {
  title:  'Pedidos "” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

interface PaginaPedidosProps {
  searchParams: {
    status?:  string
    busca?:   string
    pagina?:  string
  }
}

export default async function AdminPedidosPage({ searchParams }: PaginaPedidosProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const pagina = Number(searchParams.pagina ?? 1)

  const resultado = await listarPedidosAdmin({
    status:    searchParams.status,
    busca:     searchParams.busca,
    pagina,
    porPagina: 25,
  })

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Pedidos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {resultado.total} pedido{resultado.total !== 1 ? 's' : ''} encontrado{resultado.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros */}
      <Suspense>
        <FiltrosPedidos />
      </Suspense>

      {/* Tabela */}
      <TabelaPedidos pedidos={resultado.itens} />

      {/* Paginação */}
      <Suspense>
        <Paginacao
          paginaAtual={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          total={resultado.total}
          porPagina={25}
        />
      </Suspense>
    </div>
  )
}
