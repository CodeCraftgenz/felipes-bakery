/**
 * Página Detalhe do Pedido — Felipe's Bakery Admin
 */

import type { Metadata }          from 'next'
import { auth }                   from '@backend/lib/auth'
import { notFound, redirect }     from 'next/navigation'
import Link                       from 'next/link'
import { ChevronLeft }            from 'lucide-react'
import { buscarPedidoPorNumero }  from '@backend/modulos/pedidos/queries'
import { DetalhesPedidoAdmin }    from '@frontend/admin/pedidos/DetalhesPedidoAdmin'
import { CrachaBadgeStatus }      from '@frontend/admin/pedidos/CrachaBadgeStatus'

export const metadata: Metadata = {
  title:  'Pedido — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

interface PageProps {
  params: { numero: string }
}

export default async function AdminDetalhePedidoPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const pedido = await buscarPedidoPorNumero(params.numero)
  if (!pedido) notFound()

  return (
    <div className="space-y-5">
      {/* Breadcrumb + título */}
      <div>
        <Link
          href="/admin/pedidos"
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Pedidos
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-brand-950">
            Pedido #{pedido.numeroPedido}
          </h1>
          <CrachaBadgeStatus status={pedido.status} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'full', timeStyle: 'short',
          }).format(new Date(pedido.criadoEm))}
        </p>
      </div>

      <DetalhesPedidoAdmin pedido={pedido} />
    </div>
  )
}
