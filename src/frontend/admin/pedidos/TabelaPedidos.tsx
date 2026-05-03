/**
 * TabelaPedidos — Felipe's Bakery Admin
 *
 * Listagem de pedidos com link para o detalhe.
 */

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { CrachaBadgeStatus } from './CrachaBadgeStatus'
import type { PedidoListaAdmin } from '@backend/modulos/pedidos/admin-queries'

function formatarMoeda(valor: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

interface TabelaPedidosProps {
  pedidos: PedidoListaAdmin[]
}

export function TabelaPedidos({ pedidos }: TabelaPedidosProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pedidos.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                Nenhum pedido encontrado.
              </td>
            </tr>
          )}
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="hover:bg-stone-50/60">
              <td className="px-4 py-3 font-mono font-medium text-foreground">
                #{pedido.numeroPedido}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{pedido.nomeCliente}</p>
                <p className="text-xs text-muted-foreground">{pedido.emailCliente}</p>
              </td>
              <td className="px-4 py-3 font-medium">
                {formatarMoeda(pedido.total)}
              </td>
              <td className="px-4 py-3">
                <CrachaBadgeStatus status={pedido.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatarData(pedido.criadoEm)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/pedidos/${pedido.numeroPedido}`}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Ver <ExternalLink className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
