/**
 * Resumo do Pedido no Checkout — Felipe's Bakery
 *
 * Sidebar direita exibida durante o checkout.
 * Lista os itens do carrinho e os valores totais.
 * Não permite edição (apenas visualização).
 * Vinculado ao carrinho via Zustand.
 *
 * Client Component.
 */

'use client'

import React         from 'react'
import Image         from 'next/image'
import Link          from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Separador } from '@frontend/compartilhado/ui/separador'
import { useCarrinho } from '@frontend/compartilhado/stores/carrinho'
import { formatarMoeda } from '@compartilhado/utils'

// ── Componente ────────────────────────────────────────────────
export function ResumoCheckout() {
  const itens        = useCarrinho((s) => s.itens)
  const subtotalFn   = useCarrinho((s) => s.subtotal)
  const descontoFn   = useCarrinho((s) => s.valorDesconto)
  const totalFn      = useCarrinho((s) => s.total)
  const cupom        = useCarrinho((s) => s.cupom)

  const subtotal  = subtotalFn()
  const desconto  = descontoFn()
  const total     = totalFn()

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 sticky top-24">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="font-playfair text-lg font-semibold text-stone-900">
          Seu Pedido
        </h3>
        <Link
          href="/carrinho"
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Editar
        </Link>
      </div>

      {/* Lista de itens */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {itens.map((item) => (
          <div key={item.produtoId} className="flex items-center gap-3">
            {/* Imagem */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {item.urlImagem ? (
                <Image
                  src={item.urlImagem}
                  alt={item.nome}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-stone-200" />
              )}
              {/* Badge de quantidade */}
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
                {item.quantidade}
              </span>
            </div>

            {/* Nome e preço */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{item.nome}</p>
              {item.pesoGramas && (
                <p className="text-xs text-stone-400">{item.pesoGramas}g</p>
              )}
            </div>

            {/* Subtotal */}
            <span className="text-sm font-medium text-stone-900 shrink-0">
              {formatarMoeda(item.preco * item.quantidade)}
            </span>
          </div>
        ))}
      </div>

      <Separador />

      {/* Totais */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal</span>
          <span>{formatarMoeda(subtotal)}</span>
        </div>

        {desconto > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto ({cupom?.codigo})</span>
            <span>− {formatarMoeda(desconto)}</span>
          </div>
        )}

        <div className="flex justify-between text-stone-600">
          <span>Frete</span>
          <span className="text-green-600 font-medium">Grátis</span>
        </div>

        <Separador />

        <div className="flex justify-between font-bold text-base text-stone-900">
          <span>Total</span>
          <span>{formatarMoeda(total)}</span>
        </div>
      </div>

      {/* Info do ciclo */}
      <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-700 text-center">
        Entrega na <strong>sexta-feira</strong>
      </div>
    </div>
  )
}
