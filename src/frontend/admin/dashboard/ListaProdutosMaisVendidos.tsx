/**
 * ListaProdutosMaisVendidos — Felipe's Bakery Admin
 *
 * Widget lateral do dashboard com os top produtos dos últimos 30 dias.
 */

import { TrendingUp } from 'lucide-react'
import {
  Cartao, CartaoCabecalho, CartaoTitulo, CartaoConteudo,
} from '@frontend/compartilhado/ui'
import type { ProdutoMaisVendido } from '@backend/modulos/analytics/queries'

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(valor)
}

interface ListaProdutosMaisVendidosProps {
  produtos: ProdutoMaisVendido[]
}

export function ListaProdutosMaisVendidos({ produtos }: ListaProdutosMaisVendidosProps) {
  const maxVendas = produtos[0]?.totalVendas ?? 1

  return (
    <Cartao>
      <CartaoCabecalho className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-600" />
          <CartaoTitulo className="text-base">Top Produtos — 30 dias</CartaoTitulo>
        </div>
      </CartaoCabecalho>

      <CartaoConteudo className="p-0">
        {produtos.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <ol className="divide-y divide-border">
            {produtos.map((produto, idx) => {
              const larguraBarra = Math.round((produto.totalVendas / maxVendas) * 100)

              return (
                <li key={produto.produtoId} className="px-6 py-3">
                  <div className="flex items-center justify-between text-sm">
                    {/* Posição + nome */}
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium">{produto.nome}</span>
                    </div>

                    {/* Qtd + receita */}
                    <div className="ml-2 flex-shrink-0 text-right text-xs text-muted-foreground">
                      <p>{produto.totalVendas} un.</p>
                      <p className="font-medium text-foreground">
                        {formatarMoeda(produto.receita)}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progresso relativa */}
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-stone-100">
                    <div
                      className="h-1.5 rounded-full bg-brand-400 transition-all"
                      style={{ width: `${larguraBarra}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CartaoConteudo>
    </Cartao>
  )
}
