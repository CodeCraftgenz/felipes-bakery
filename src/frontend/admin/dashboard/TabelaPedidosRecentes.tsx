/**
 * TabelaPedidosRecentes — Felipe's Bakery Admin
 *
 * Tabela compacta com os últimos pedidos para o widget do dashboard.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  Cartao, CartaoCabecalho, CartaoTitulo, CartaoConteudo,
} from '@frontend/compartilhado/ui'
import { CrachaBadgeStatus } from '@frontend/admin/pedidos/CrachaBadgeStatus'
import type { PedidoRecente } from '@backend/modulos/analytics/queries'

// ── Helpers ───────────────────────────────────────────────────

/** Formata um valor numérico como moeda BRL */
function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor))
}

/** Formata data relativa de forma simples */
function formatarDataRelativa(data: Date): string {
  const agora  = new Date()
  const diffMs = agora.getTime() - new Date(data).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1)  return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `${diffH}h atrás`

  const diffD = Math.floor(diffH / 24)
  return `${diffD}d atrás`
}

// ── Componente ────────────────────────────────────────────────

interface TabelaPedidosRecentesProps {
  pedidos: PedidoRecente[]
}

export function TabelaPedidosRecentes({ pedidos }: TabelaPedidosRecentesProps) {
  return (
    <Cartao className="col-span-full lg:col-span-2">
      <CartaoCabecalho className="flex flex-row items-center justify-between pb-3">
        <CartaoTitulo className="text-base">Pedidos Recentes</CartaoTitulo>
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </CartaoCabecalho>

      <CartaoConteudo className="p-0">
        {pedidos.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhum pedido ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {pedidos.map((pedido) => (
              <Link
                key={pedido.id}
                href={`/admin/pedidos/${pedido.numeroPedido}`}
                className="flex items-center justify-between px-6 py-3 text-sm transition-colors hover:bg-stone-50"
              >
                {/* Número + cliente */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    #{pedido.numeroPedido}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {pedido.nomeCliente}
                  </p>
                </div>

                {/* Status */}
                <div className="mx-3 flex-shrink-0">
                  <CrachaBadgeStatus status={pedido.status} />
                </div>

                {/* Valor + data */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-medium">{formatarMoeda(pedido.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarDataRelativa(pedido.criadoEm)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CartaoConteudo>
    </Cartao>
  )
}
