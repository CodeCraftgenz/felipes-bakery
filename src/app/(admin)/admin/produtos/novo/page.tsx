/**
 * PÃ¡gina Novo Produto â€” Felipe's Bakery Admin
 */

import type { Metadata }     from 'next'
import { auth }              from '@backend/lib/auth'
import { redirect }          from 'next/navigation'
import Link                  from 'next/link'
import { ChevronLeft }       from 'lucide-react'
import { buscarCategorias }  from '@backend/modulos/categorias/queries'
import { FormularioProduto } from '@frontend/admin/produtos/FormularioProduto'

export const metadata: Metadata = {
  title:  'Novo Produto â€” Admin',
  robots: { index: false, follow: false },
}

export default async function NovoProdutoPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const categorias = await buscarCategorias()

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
      </div>

      <FormularioProduto categorias={categorias} />
    </div>
  )
}
