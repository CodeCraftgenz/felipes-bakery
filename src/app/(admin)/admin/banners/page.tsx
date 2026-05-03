/**
 * Página de Banners — Felipe's Bakery Admin
 *
 * Gerenciamento de banners exibidos no site público.
 * Server Component.
 */

import type { Metadata }       from 'next'
import { auth }                from '@backend/lib/auth'
import { redirect }            from 'next/navigation'
import { listarBanners }       from '@backend/modulos/banners/queries'
import { GerenciadorBanners }  from '@frontend/admin/banners/GerenciadorBanners'

export const metadata: Metadata = {
  title:  'Banners — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminBannersPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const banners = await listarBanners()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Banners</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gerencie os banners exibidos no site
        </p>
      </div>

      <GerenciadorBanners bannersIniciais={banners} />
    </div>
  )
}
