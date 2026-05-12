/**
 * TabelaTopClientes — Felipe's Bakery Admin
 *
 * Top clientes por valor total gasto.
 * Server-safe (sem hooks).
 */

import { Cartao, CartaoCabecalho, CartaoTitulo, CartaoConteudo } from '@frontend/compartilhado/ui'
import type { TopCliente } from '@backend/modulos/analytics/relatorios'

interface Props {
  clientes: TopCliente[]
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(valor)
}

export function TabelaTopClientes({ clientes }: Props) {
  return (
    <Cartao>
      <CartaoCabecalho>
        <CartaoTitulo>Top Clientes</CartaoTitulo>
      </CartaoCabecalho>
      <CartaoConteudo className="p-0">
        {clientes.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Ainda sem clientes recorrentes.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {clientes.map((c, i) => (
              <li key={c.clienteId} className="flex items-center gap-3 px-6 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">{c.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-stone-900">
                    {formatarMoeda(c.valorTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.totalPedidos} pedido{c.totalPedidos === 1 ? '' : 's'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CartaoConteudo>
    </Cartao>
  )
}
