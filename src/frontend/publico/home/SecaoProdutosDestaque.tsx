/**
 * Seção Produtos em Destaque — Felipe's Bakery
 *
 * Exibe os produtos marcados como destaque na Home.
 * Usa o CartaoProduto compartilhado com o catálogo.
 *
 * Server Component — recebe os produtos como prop do servidor.
 */

import React    from 'react'
import Link     from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CartaoProduto } from '@frontend/publico/catalogo/CartaoProduto'
import type { ProdutoResumo } from '@backend/modulos/produtos/queries'

// ── Props ─────────────────────────────────────────────────────
interface PropsSecaoProdutosDestaque {
  produtos: ProdutoResumo[]
}

// ── Componente ────────────────────────────────────────────────
export function SecaoProdutosDestaque({ produtos }: PropsSecaoProdutosDestaque) {
  if (produtos.length === 0) return null

  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Cabeçalho da seção */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-playfair text-3xl font-bold text-stone-900 sm:text-4xl">
              Mais Pedidos
            </h2>
            <p className="mt-2 text-stone-500">
              Os favoritos dos nossos clientes
            </p>
          </div>
          <Link
            href="/catalogo"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grade de produtos */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((produto) => (
            <CartaoProduto key={produto.id} produto={produto} />
          ))}
        </div>

        {/* Link mobile para ver todos */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            Ver cardápio completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}
