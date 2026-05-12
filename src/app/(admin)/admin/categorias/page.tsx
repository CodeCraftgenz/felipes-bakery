/**
 * Página Gestão de Categorias "” Felipe's Bakery Admin
 */

import type { Metadata }                  from 'next'
import { auth }                           from '@backend/lib/auth'
import { redirect }                       from 'next/navigation'
import { listarCategoriasComContagem }    from '@backend/modulos/categorias/queries'
import { GerenciadorCategorias }          from '@frontend/admin/categorias/GerenciadorCategorias'

export const metadata: Metadata = {
  title:  'Categorias — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const categorias = await listarCategoriasComContagem()

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Categorias</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Organize o catálogo. Cada cartão mostra quantos produtos
          a categoria possui — clique em &quot;Adicionar&quot; para criar
          um produto já vinculado.
        </p>
      </div>

      <GerenciadorCategorias categorias={categorias} />
    </div>
  )
}
