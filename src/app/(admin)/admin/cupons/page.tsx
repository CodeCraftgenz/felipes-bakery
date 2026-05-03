/**
 * Página de Cupons — Felipe's Bakery Admin
 *
 * Gerenciamento de cupons de desconto.
 * Server Component que carrega os cupons e renderiza o gerenciador (Client Component).
 */

import type { Metadata }       from 'next'
import { auth }                from '@backend/lib/auth'
import { redirect }            from 'next/navigation'
import { listarCupons }        from '@backend/modulos/cupons/queries'
import { GerenciadorCupons }   from '@frontend/admin/cupons/GerenciadorCupons'

export const metadata: Metadata = {
  title:  'Cupons — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminCuponsPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const cupons = await listarCupons()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Cupons</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gerencie cupons de desconto para os pedidos
        </p>
      </div>

      <GerenciadorCupons cuponsIniciais={cupons} />
    </div>
  )
}
