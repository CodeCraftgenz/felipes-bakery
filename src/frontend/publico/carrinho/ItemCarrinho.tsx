/**
 * Item do Carrinho — Felipe's Bakery
 *
 * Linha de um produto no carrinho.
 * Exibe: imagem, nome, preço unitário, seletor de quantidade, subtotal e botão de remover.
 *
 * Client Component.
 */

'use client'

import React        from 'react'
import Image        from 'next/image'
import Link         from 'next/link'
import { Trash2, Minus, Plus } from 'lucide-react'
import { toast }    from 'sonner'
import { Botao }    from '@frontend/compartilhado/ui/botao'
import {
  useCarrinho,
  LIMITE_POR_PRODUTO,
  type ItemCarrinho as TipoItemCarrinho,
} from '@frontend/compartilhado/stores/carrinho'
import { formatarMoeda } from '@compartilhado/utils'

// ── Props ─────────────────────────────────────────────────────
interface PropsItemCarrinho {
  item: TipoItemCarrinho
}

// ── Componente ────────────────────────────────────────────────
export function ItemCarrinho({ item }: PropsItemCarrinho) {
  const atualizarQuantidade = useCarrinho((s) => s.atualizarQuantidade)
  const removerItem         = useCarrinho((s) => s.removerItem)

  const subtotal = item.preco * item.quantidade
  const noLimite = item.quantidade >= LIMITE_POR_PRODUTO

  const aumentar = () => {
    const r = atualizarQuantidade(item.produtoId, item.quantidade + 1)
    if (!r.ok) toast.error(r.mensagem)
  }

  const diminuir = () => {
    atualizarQuantidade(item.produtoId, item.quantidade - 1)
  }

  return (
    <div className="flex gap-4 py-5">

      {/* Imagem do produto */}
      <Link href={`/produto/${item.slug}`} className="shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-stone-100 sm:h-24 sm:w-24">
          {item.urlImagem ? (
            <Image
              src={item.urlImagem}
              alt={item.nome}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-stone-200" />
          )}
        </div>
      </Link>

      {/* Informações */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            {/* Nome */}
            <Link
              href={`/produto/${item.slug}`}
              className="font-medium text-stone-900 hover:text-brand-700 transition-colors leading-tight line-clamp-2"
            >
              {item.nome}
            </Link>
            {/* Peso */}
            {item.pesoGramas && (
              <span className="text-xs text-stone-400 mt-0.5 block">{item.pesoGramas}g</span>
            )}
            {/* Preço unitário */}
            <span className="text-sm text-stone-500 mt-1 block">
              {formatarMoeda(item.preco)} / un.
            </span>
          </div>

          {/* Botão remover */}
          <Botao
            variante="fantasma"
            tamanho="icone"
            onClick={() => removerItem(item.produtoId)}
            aria-label={`Remover ${item.nome} do carrinho`}
            className="text-stone-400 hover:text-red-600 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Botao>
        </div>

        {/* Controles de quantidade + subtotal */}
        <div className="flex items-center justify-between mt-3">
          {/* Seletor de quantidade */}
          <div className="flex items-center gap-2">
            <Botao
              variante="contorno"
              tamanho="icone"
              onClick={diminuir}
              disabled={item.quantidade <= 1}
              aria-label="Diminuir quantidade"
              className="h-8 w-8"
            >
              <Minus className="h-3 w-3" />
            </Botao>

            <span className="w-8 text-center text-sm font-semibold text-stone-900">
              {item.quantidade}
            </span>

            <Botao
              variante="contorno"
              tamanho="icone"
              onClick={aumentar}
              disabled={noLimite}
              aria-label="Aumentar quantidade"
              className="h-8 w-8"
            >
              <Plus className="h-3 w-3" />
            </Botao>
          </div>

          {/* Subtotal do item */}
          <span className="font-semibold text-stone-900">
            {formatarMoeda(subtotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
