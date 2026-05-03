/**
 * TabelaEstoque — Felipe's Bakery Admin
 *
 * Lista todos os produtos com quantidade em estoque e status de alerta.
 * Abre modal de ajuste ao clicar no botão de cada linha.
 */

'use client'

import { useState }            from 'react'
import { AlertTriangle, Edit3 } from 'lucide-react'
import { cn }                  from '@compartilhado/utils'
import { ModalAjusteEstoque }  from './ModalAjusteEstoque'
import type { ItemEstoque }    from '@backend/modulos/estoque/queries'

interface TabelaEstoqueProps {
  itens: ItemEstoque[]
}

export function TabelaEstoque({ itens }: TabelaEstoqueProps) {
  const [itemSelecionado, setItem] = useState<ItemEstoque | null>(null)

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3 text-center">Qtd. Atual</th>
              <th className="px-4 py-3 text-center">Alerta Mín.</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3 text-right">Ajustar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {itens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto no estoque.
                </td>
              </tr>
            )}
            {itens.map((item) => (
              <tr
                key={item.produtoId}
                className={cn(
                  'hover:bg-stone-50/60',
                  item.emAlerta && 'bg-red-50/40',
                )}
              >
                {/* Nome */}
                <td className="px-4 py-3">
                  <p className="font-medium">{item.nomeProduto}</p>
                  <p className="text-xs text-muted-foreground">{item.slugProduto}</p>
                </td>

                {/* Quantidade atual */}
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    'text-lg font-bold',
                    item.emAlerta ? 'text-red-600' : 'text-foreground',
                  )}>
                    {item.quantidade}
                  </span>
                </td>

                {/* Alerta mínimo */}
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {item.alertaMinimo}
                </td>

                {/* Situação */}
                <td className="px-4 py-3">
                  {item.emAlerta ? (
                    <div className="flex items-center gap-1.5 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Estoque baixo</span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Normal</span>
                  )}
                </td>

                {/* Ação */}
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setItem(item)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-100"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Ajustar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de ajuste */}
      {itemSelecionado && (
        <ModalAjusteEstoque
          item={itemSelecionado}
          aberto={!!itemSelecionado}
          aoFechar={() => setItem(null)}
        />
      )}
    </>
  )
}
