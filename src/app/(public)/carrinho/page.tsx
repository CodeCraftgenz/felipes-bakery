/**
 * Página do Carrinho — Felipe's Bakery
 *
 * Exibe os itens no carrinho, permite ajustar quantidades e remover itens.
 * Sidebar direita com resumo de valores, cupom e botão de checkout.
 *
 * Client Component (lê do Zustand store que persiste no localStorage).
 */

'use client'

import React        from 'react'
import Link         from 'next/link'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { ItemCarrinho }   from '@frontend/publico/carrinho/ItemCarrinho'
import { ResumoCarrinho } from '@frontend/publico/carrinho/ResumoCarrinho'
import { Botao }          from '@frontend/compartilhado/ui/botao'
import { Separador }      from '@frontend/compartilhado/ui/separador'
import { useCarrinho }    from '@frontend/compartilhado/stores/carrinho'

// ── Componente ────────────────────────────────────────────────
export default function PaginaCarrinho() {
  const itens      = useCarrinho((s) => s.itens)
  const totalItens = useCarrinho((s) => s.totalItens())
  const limpar     = useCarrinho((s) => s.limparCarrinho)

  // Carrinho vazio
  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="h-20 w-20 text-stone-300 mb-6" />
            <h1 className="font-playfair text-2xl font-bold text-stone-800">
              Seu carrinho está vazio
            </h1>
            <p className="mt-3 text-stone-500 max-w-xs">
              Adicione pães artesanais do nosso cardápio para começar seu pedido.
            </p>
            <Link href="/catalogo" className="mt-8">
              <Botao variante="padrao" tamanho="g">
                Ver Cardápio
              </Botao>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Cabeçalho da página */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/catalogo"
              className="mb-3 flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Continuar comprando
            </Link>
            <h1 className="font-playfair text-3xl font-bold text-stone-900">
              Meu Carrinho
            </h1>
            <p className="mt-1 text-stone-500 text-sm">
              {totalItens} {totalItens === 1 ? 'item' : 'itens'}
            </p>
          </div>

          {/* Limpar carrinho */}
          <Botao
            variante="fantasma"
            tamanho="p"
            onClick={limpar}
            className="text-stone-400 hover:text-red-500"
          >
            Limpar carrinho
          </Botao>
        </div>

        {/* Layout: lista de itens + sidebar de resumo */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Lista de itens */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-stone-200 bg-white">
              <div className="divide-y divide-stone-100 px-5">
                {itens.map((item) => (
                  <ItemCarrinho key={item.produtoId} item={item} />
                ))}
              </div>
            </div>

            {/* Aviso sobre o ciclo de pedidos */}
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
              <p className="text-sm text-brand-800">
                <strong>Prazo de pedidos:</strong> Finalize seu pedido até{' '}
                <strong>quarta-feira às 23h</strong> para receber na{' '}
                <strong>sexta-feira</strong>.
              </p>
            </div>
          </div>

          {/* Sidebar de resumo */}
          <div className="lg:col-span-1">
            <ResumoCarrinho />
          </div>

        </div>
      </div>
    </div>
  )
}
