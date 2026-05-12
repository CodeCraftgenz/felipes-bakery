/**
 * Página Novo Produto — Felipe's Bakery Admin
 *
 * Aceita ?categoriaId=N na URL para pré-selecionar a categoria
 * (usado pelo atalho "Adicionar" da página de categorias).
 */

import type { Metadata }     from 'next'
import { auth }              from '@backend/lib/auth'
import { redirect }          from 'next/navigation'
import Link                  from 'next/link'
import { ChevronLeft }       from 'lucide-react'
import { buscarCategorias }  from '@backend/modulos/categorias/queries'
import { FormularioProduto } from '@frontend/admin/produtos/FormularioProduto'

export const metadata: Metadata = {
  title:  'Novo Produto — Admin',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: { categoriaId?: string }
}

export default async function NovoProdutoPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const categorias       = await buscarCategorias()
  const categoriaIdParam = searchParams.categoriaId
    ? Number(searchParams.categoriaId)
    : undefined

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/produtos"
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Produtos
        </Link>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Novo Produto</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Após criar, você poderá adicionar imagens e ajustar o estoque inicial.
        </p>
      </div>

      <FormularioProduto
        categorias={categorias}
        dadosIniciais={categoriaIdParam ? { categoriaId: categoriaIdParam } : undefined}
      />
    </div>
  )
}
