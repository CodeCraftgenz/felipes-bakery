/**
 * TabelaEstoqueCritico — Felipe's Bakery Admin
 *
 * Produtos com estoque <= alertaMinimo.
 * Server-safe.
 */

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Cartao, CartaoCabecalho, CartaoTitulo, CartaoConteudo } from '@frontend/compartilhado/ui'
import type { EstoqueCritico } from '@backend/modulos/analytics/relatorios'

interface Props {
  produtos: EstoqueCritico[]
}

export function TabelaEstoqueCritico({ produtos }: Props) {
  return (
    <Cartao>
      <CartaoCabecalho>
        <CartaoTitulo className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Estoque Crítico
        </CartaoTitulo>
      </CartaoCabecalho>
      <CartaoConteudo className="p-0">
        {produtos.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhum produto em alerta de estoque.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {produtos.map((p) => {
              const esgotado = p.quantidade === 0
              return (
                <li key={p.produtoId} className="flex items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/estoque?produto=${p.slug}`}
                      className="truncate font-medium text-stone-900 hover:text-brand-700"
                    >
                      {p.nome}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Mínimo de alerta: {p.alertaMinimo} un.
                    </p>
                  </div>
                  <span
                    className={
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                      (esgotado
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700')
                    }
                  >
                    {esgotado ? 'Esgotado' : `${p.quantidade} un.`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CartaoConteudo>
    </Cartao>
  )
}
