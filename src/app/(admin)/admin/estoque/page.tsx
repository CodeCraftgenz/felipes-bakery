/**
 * Página Controle de Estoque "” Felipe's Bakery Admin
 *
 * Exibe todos os produtos com quantidade atual e alerta de estoque baixo.
 * Server Component.
 */

import type { Metadata }     from 'next'
import { auth }              from '@backend/lib/auth'
import { redirect }          from 'next/navigation'
import { AlertTriangle }     from 'lucide-react'
import { listarEstoque, buscarProdutosEmAlerta } from '@backend/modulos/estoque/queries'
import { TabelaEstoque }     from '@frontend/admin/estoque/TabelaEstoque'

export const metadata: Metadata = {
  title:  'Estoque "” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminEstoquePage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const [itens, emAlerta] = await Promise.all([
    listarEstoque(),
    buscarProdutosEmAlerta(),
  ])

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Estoque</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {itens.length} produto{itens.length !== 1 ? 's' : ''} no controle de estoque
        </p>
      </div>

      {/* Banner de alerta quando há produtos abaixo do mínimo */}
      {emAlerta.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-700">
              {emAlerta.length} produto{emAlerta.length !== 1 ? 's' : ''} com estoque abaixo do mínimo
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {emAlerta.map((p) => p.nomeProduto).join(', ')}
            </p>
          </div>
        </div>
      )}

      <TabelaEstoque itens={itens} />
    </div>
  )
}
