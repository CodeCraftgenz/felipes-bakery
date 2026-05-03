/**
 * Botão Adicionar ao Carrinho — Página do Produto
 *
 * Client Component interativo para a página de detalhes do produto.
 * Permite selecionar a quantidade antes de adicionar.
 * Mostra feedback visual (animação + toast) ao adicionar.
 */

'use client'

import React          from 'react'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { toast }      from 'sonner'
import { Botao }      from '@frontend/compartilhado/ui/botao'
import { useCarrinho } from '@frontend/compartilhado/stores/carrinho'
import { formatarMoeda } from '@compartilhado/utils'
import type { ProdutoCompleto } from '@backend/modulos/produtos/queries'

// ── Props ─────────────────────────────────────────────────────
interface PropsBotaoAdicionarCarrinho {
  produto: ProdutoCompleto
}

// ── Componente ────────────────────────────────────────────────
export function BotaoAdicionarCarrinho({ produto }: PropsBotaoAdicionarCarrinho) {
  const adicionarItem = useCarrinho((s) => s.adicionarItem)
  const [quantidade, setQuantidade] = React.useState(1)
  const [adicionado, setAdicionado] = React.useState(false)

  const semEstoque = produto.estoqueQtd !== null && produto.estoqueQtd <= 0
  const estoqueMaximo = produto.estoqueQtd ?? 99

  const diminuirQuantidade = () => {
    setQuantidade((q) => Math.max(1, q - 1))
  }

  const aumentarQuantidade = () => {
    setQuantidade((q) => Math.min(estoqueMaximo, q + 1))
  }

  const aoAdicionarAoCarrinho = () => {
    if (semEstoque) return

    adicionarItem(
      {
        produtoId:  produto.id,
        slug:       produto.slug,
        nome:       produto.nome,
        preco:      parseFloat(produto.preco),
        urlImagem:  produto.urlImagem ?? undefined,
        pesoGramas: produto.pesoGramas,
      },
      quantidade,
    )

    // Feedback visual
    setAdicionado(true)
    toast.success(
      quantidade === 1
        ? `${produto.nome} adicionado ao carrinho!`
        : `${quantidade}× ${produto.nome} adicionados ao carrinho!`,
      {
        description: `Total: ${formatarMoeda(parseFloat(produto.preco) * quantidade)}`,
        action: {
          label: 'Ver carrinho',
          onClick: () => { window.location.href = '/carrinho' },
        },
      },
    )

    // Reset após animação
    setTimeout(() => {
      setAdicionado(false)
      setQuantidade(1)
    }, 2000)
  }

  return (
    <div className="space-y-4">

      {/* Seletor de quantidade */}
      {!semEstoque && (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Quantidade
          </label>
          <div className="flex items-center gap-3">
            <Botao
              variante="contorno"
              tamanho="icone"
              onClick={diminuirQuantidade}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </Botao>

            <span className="w-12 text-center text-xl font-semibold text-stone-900">
              {quantidade}
            </span>

            <Botao
              variante="contorno"
              tamanho="icone"
              onClick={aumentarQuantidade}
              disabled={quantidade >= estoqueMaximo}
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </Botao>

            {/* Exibe estoque baixo */}
            {produto.estoqueQtd !== null && produto.estoqueQtd <= 5 && (
              <span className="text-xs text-amber-600 font-medium">
                Apenas {produto.estoqueQtd} disponíve{produto.estoqueQtd === 1 ? 'l' : 'is'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Preço total */}
      {!semEstoque && quantidade > 1 && (
        <p className="text-sm text-stone-500">
          Total: <strong className="text-stone-900">
            {formatarMoeda(parseFloat(produto.preco) * quantidade)}
          </strong>
        </p>
      )}

      {/* Botão principal */}
      <Botao
        variante={semEstoque ? 'contorno' : 'padrao'}
        tamanho="g"
        onClick={aoAdicionarAoCarrinho}
        disabled={semEstoque || adicionado}
        className="w-full sm:w-auto gap-2"
      >
        <ShoppingBag className="h-5 w-5" />
        {semEstoque
          ? 'Produto Esgotado'
          : adicionado
            ? 'Adicionado!'
            : 'Adicionar ao Carrinho'}
      </Botao>

    </div>
  )
}
