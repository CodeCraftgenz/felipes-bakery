/**
 * Página de Gestão de Produtos "” Felipe's Bakery Admin
 *
 * Listagem paginada com filtros por status, categoria e busca de texto.
 * Server Component "” dados carregados no servidor.
 */

import type { Metadata }      from 'next'
import { auth }               from '@backend/lib/auth'
import { redirect }           from 'next/navigation'
import { Suspense }           from 'react'
import { listarProdutosAdmin } from '@backend/modulos/produtos/queries'
import { buscarCategorias }   from '@backend/modulos/categorias/queries'
import { TabelaProdutos }     from '@frontend/admin/produtos/TabelaProdutos'
import { FiltrosProdutos }    from '@frontend/admin/produtos/FiltrosProdutos'
import { Paginacao }          from '@frontend/admin/compartilhado/Paginacao'

export const metadata: Metadata = {
  title:  'Produtos "” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

interface PaginaProdutosProps {
  searchParams: {
    busca?:       string
    status?:      string
    categoriaId?: string
    pagina?:      string
  }
}

export default async function AdminProdutosPage({ searchParams }: PaginaProdutosProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const pagina     = Number(searchParams.pagina ?? 1)
  const categoriaId = searchParams.categoriaId ? Number(searchParams.categoriaId) : undefined

  const [resultado, categorias] = await Promise.all([
    listarProdutosAdmin({
      busca:       searchParams.busca,
      status:      searchParams.status,
      categoriaId,
      pagina,
      porPagina:   20,
    }),
    buscarCategorias(),
  ])

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Produtos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {resultado.total} produto{resultado.total !== 1 ? 's' : ''} cadastrado{resultado.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros + botão novo */}
      <Suspense>
        <FiltrosProdutos categorias={categorias} />
      </Suspense>

      {/* Tabela */}
      <TabelaProdutos produtos={resultado.itens} />

      {/* Paginação */}
      <Suspense>
        <Paginacao
          paginaAtual={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          total={resultado.total}
          porPagina={20}
        />
      </Suspense>
    </div>
  )
}
