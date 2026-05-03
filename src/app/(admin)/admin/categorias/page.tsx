/**
 * PÃ¡gina GestÃ£o de Categorias â€” Felipe's Bakery Admin
 */

import type { Metadata }            from 'next'
import { auth }                     from '@backend/lib/auth'
import { redirect }                 from 'next/navigation'
import { buscarCategorias }         from '@backend/modulos/categorias/queries'
import { GerenciadorCategorias }    from '@frontend/admin/categorias/GerenciadorCategorias'

export const metadata: Metadata = {
  title:  'Categorias â€” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  // buscarCategorias retorna somente as ativas; para admin precisamos de todas
  // (inclui ativas) â€” OK para esta fase, podemos expandir depois
  const categorias = await buscarCategorias()

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Categorias</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Organize o catÃ¡logo de produtos por categoria
        </p>
      </div>

      <GerenciadorCategorias categorias={categorias} />
    </div>
  )
}
