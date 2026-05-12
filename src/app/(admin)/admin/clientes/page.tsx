/**
 * Página de Clientes "” Felipe's Bakery Admin
 *
 * Lista paginada de clientes com busca e métricas de compra.
 * Server Component.
 */

import type { Metadata }  from 'next'
import { auth }           from '@backend/lib/auth'
import { redirect }       from 'next/navigation'
import { Suspense }       from 'react'
import { Search }         from 'lucide-react'
import { listarClientes } from '@backend/modulos/clientes/queries'
import { Paginacao }      from '@frontend/admin/compartilhado/Paginacao'

export const metadata: Metadata = {
  title:  'Clientes "” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

interface PageProps {
  searchParams: { busca?: string; pagina?: string }
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(data))
}

export default async function AdminClientesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const pagina    = Number(searchParams.pagina ?? 1)
  const resultado = await listarClientes(searchParams.busca, pagina, 25)

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Clientes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {resultado.total} cliente{resultado.total !== 1 ? 's' : ''} cadastrado{resultado.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Busca "” simples form GET (Server Component compatível) */}
      <form method="GET" className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="busca"
            defaultValue={searchParams.busca ?? ''}
            placeholder="Buscar por nome ou e-mail..."
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-stone-50"
        >
          Buscar
        </button>
        {searchParams.busca && (
          <a href="/admin/clientes" className="h-9 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
            Limpar
          </a>
        )}
      </form>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3 text-center">Pedidos</th>
              <th className="px-4 py-3 text-right">Total Gasto</th>
              <th className="px-4 py-3">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {resultado.itens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {resultado.itens.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-stone-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium">{cliente.nome}</p>
                  <p className="text-xs text-muted-foreground">{cliente.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {cliente.telefone ?? '"”'}
                </td>
                <td className="px-4 py-3 text-center font-medium">
                  {cliente.totalPedidos}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatarMoeda(cliente.totalGasto)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarData(cliente.criadoEm)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
