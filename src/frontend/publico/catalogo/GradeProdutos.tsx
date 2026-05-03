/**
 * Grade de Produtos — Felipe's Bakery
 *
 * Exibe a grade responsiva de CartaoProduto no catálogo.
 * Mostra estado vazio quando não há resultados com os filtros aplicados.
 *
 * Server Component (não precisa de interatividade).
 */

import React    from 'react'
import Link     from 'next/link'
import { PackageOpen } from 'lucide-react'
import { CartaoProduto } from './CartaoProduto'
import type { ProdutoResumo } from '@backend/modulos/produtos/queries'

// ── Props ─────────────────────────────────────────────────────
interface PropsGradeProdutos {
  produtos: ProdutoResumo[]
  buscaAtiva?: boolean
}

// ── Componente ────────────────────────────────────────────────
export function GradeProdutos({ produtos, buscaAtiva = false }: PropsGradeProdutos) {
  // Estado vazio
  if (produtos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageOpen className="h-16 w-16 text-stone-300 mb-4" />
        <h3 className="text-xl font-semibold text-stone-700">
          {buscaAtiva ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
        </h3>
        <p className="mt-2 text-stone-500 text-sm max-w-xs">
          {buscaAtiva
            ? 'Tente outros termos ou limpe os filtros para ver todo o cardápio.'
            : 'O cardápio está sendo atualizado. Volte em breve!'}
        </p>
        {buscaAtiva && (
          <Link
            href="/catalogo"
            className="mt-5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            Ver cardápio completo →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Contador de resultados */}
      <p className="mb-5 text-sm text-stone-500">
        {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'} encontrado{produtos.length !== 1 ? 's' : ''}
      </p>

      {/* Grade */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((produto) => (
          <CartaoProduto key={produto.id} produto={produto} />
        ))}
      </div>
    </div>
  )
}
