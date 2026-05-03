/**
 * Cartão de Produto — Felipe's Bakery
 *
 * Card exibido na grade do catálogo e na seção de destaques da Home.
 * Exibe: imagem, nome, peso, preço e botão de adicionar ao carrinho.
 *
 * Client Component — precisa do store do carrinho (Zustand).
 */

'use client'

import React        from 'react'
import Link         from 'next/link'
import Image        from 'next/image'
import { ShoppingBag, ImageOff } from 'lucide-react'
import { toast }    from 'sonner'
import { Botao }    from '@frontend/compartilhado/ui/botao'
import { Cracha }   from '@frontend/compartilhado/ui/cracha'
import { useCarrinho } from '@frontend/compartilhado/stores/carrinho'
import { formatarMoeda } from '@compartilhado/utils'
import type { ProdutoResumo } from '@backend/modulos/produtos/queries'

// ── Props ─────────────────────────────────────────────────────
interface PropsCartaoProduto {
  produto: ProdutoResumo
}

// ── Componente ────────────────────────────────────────────────
export function CartaoProduto({ produto }: PropsCartaoProduto) {
  const adicionarItem = useCarrinho((s) => s.adicionarItem)
  const [adicionando, setAdicionando] = React.useState(false)

  // Verifica se o produto tem estoque disponível
  const semEstoque = produto.estoqueQtd !== null && produto.estoqueQtd <= 0

  const aoAdicionarAoCarrinho = (e: React.MouseEvent) => {
    // Evita navegar para a página do produto ao clicar no botão
    e.preventDefault()
    e.stopPropagation()

    if (semEstoque) return

    setAdicionando(true)
    adicionarItem({
      produtoId:  produto.id,
      slug:       produto.slug,
      nome:       produto.nome,
      preco:      parseFloat(produto.preco),
      urlImagem:  produto.urlImagem ?? undefined,
      pesoGramas: produto.pesoGramas,
    })

    toast.success(`${produto.nome} adicionado ao carrinho!`, {
      description: `R$ ${produto.preco.replace('.', ',')}`,
    })

    // Reset visual do botão após animação
    setTimeout(() => setAdicionando(false), 800)
  }

  return (
    <Link
      href={`/produto/${produto.slug}`}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-white overflow-hidden transition-all duration-200 hover:shadow-md hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {/* Imagem do produto */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {produto.urlImagem ? (
          <Image
            src={produto.urlImagem}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Placeholder quando não há imagem
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-12 w-12 text-stone-300" />
          </div>
        )}

        {/* Badge de destaque */}
        {produto.emDestaque === 1 && (
          <div className="absolute left-3 top-3">
            <Cracha variante="padrao">Destaque</Cracha>
          </div>
        )}

        {/* Badge de esgotado */}
        {semEstoque && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Cracha variante="secundario" className="text-white border-white/30">
              Esgotado
            </Cracha>
          </div>
        )}
      </div>

      {/* Informações do produto */}
      <div className="flex flex-1 flex-col p-4">
        {/* Categoria */}
        <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">
          {produto.nomeCategoria ?? ''}
        </span>

        {/* Nome */}
        <h3 className="mt-1 font-playfair text-lg font-semibold text-stone-900 leading-tight group-hover:text-brand-700 transition-colors line-clamp-2">
          {produto.nome}
        </h3>

        {/* Peso */}
        {produto.pesoGramas && (
          <span className="mt-1 text-sm text-stone-400">
            {produto.pesoGramas}g
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preço e botão */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            {/* Preço com desconto (riscado) */}
            {produto.precoCompare && (
              <span className="block text-xs text-stone-400 line-through">
                {formatarMoeda(produto.precoCompare)}
              </span>
            )}
            <span className="text-xl font-bold text-stone-900">
              {formatarMoeda(produto.preco)}
            </span>
          </div>

          {/* Botão adicionar ao carrinho */}
          <Botao
            variante={semEstoque ? 'contorno' : 'padrao'}
            tamanho="icone"
            onClick={aoAdicionarAoCarrinho}
            disabled={semEstoque || adicionando}
            aria-label={`Adicionar ${produto.nome} ao carrinho`}
            className="shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
          </Botao>
        </div>
      </div>
    </Link>
  )
}
