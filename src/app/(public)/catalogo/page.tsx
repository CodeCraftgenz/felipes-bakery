/**
 * Página do Catálogo — Felipe's Bakery
 *
 * Lista todos os produtos com filtros por categoria e busca por nome.
 * Os filtros são lidos via searchParams da URL para:
 *   - Compatibilidade com SSR (dados corretos no servidor)
 *   - Compartilhamento de links filtrados
 *   - Indexação do Google por categoria
 *
 * Estratégia de cache: ISR com revalidação a cada 1 hora.
 */

import type { Metadata }        from 'next'
import { Suspense }             from 'react'
import { buscarProdutos }       from '@backend/modulos/produtos/queries'
import { buscarCategorias }     from '@backend/modulos/categorias/queries'
import { GradeProdutos }        from '@frontend/publico/catalogo/GradeProdutos'
import { FiltrosCatalogo }      from '@frontend/publico/catalogo/FiltrosCatalogo'
import { Esqueleto }            from '@frontend/compartilhado/ui/esqueleto'

// Sempre busca dados frescos — produtos e estoque mudam frequentemente
export const dynamic = 'force-dynamic'

// ── Metadata dinâmica por categoria ──────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const categoria = params.categoria

  const titulo = categoria
    ? `${categoria.replace(/-/g, ' ')} | Cardápio — Felipe's Bakery`
    : "Cardápio Completo — Felipe's Bakery"

  return {
    title: titulo,
    description:
      "Pães artesanais de fermentação natural. Ciabattas, focaccias, croissants e muito mais. Peça até quarta, receba na sexta.",
  }
}

// ── Props ─────────────────────────────────────────────────────
interface PropsPaginaCatalogo {
  searchParams: Promise<{ categoria?: string; busca?: string }>
}

// ── Skeleton da grade ─────────────────────────────────────────
function EsqueletoGrade() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-stone-200 overflow-hidden">
          <Esqueleto className="h-52 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Esqueleto className="h-3 w-24" />
            <Esqueleto className="h-5 w-3/4" />
            <Esqueleto className="h-3 w-16" />
            <div className="flex items-center justify-between pt-2">
              <Esqueleto className="h-7 w-20" />
              <Esqueleto className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────
export default async function PaginaCatalogo({ searchParams }: PropsPaginaCatalogo) {
  const params   = await searchParams
  const categoria = params.categoria
  const busca     = params.busca

  // Busca dados em paralelo — .catch garante que tabelas ausentes não derrubam a página
  const [produtos, categorias] = await Promise.all([
    buscarProdutos(categoria, busca).catch(() => []),
    buscarCategorias().catch(() => []),
  ])

  const temFiltros = !!(categoria || busca)

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Cabeçalho da página */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-stone-900 sm:text-4xl">
            {categoria
              ? categorias.find((c) => c.slug === categoria)?.nome ?? 'Cardápio'
              : 'Cardápio Completo'}
          </h1>
          <p className="mt-2 text-stone-500">
            Pães artesanais de fermentação natural · Peça até quarta, receba na sexta
          </p>
        </div>

        {/* Filtros (Client Component com Suspense para evitar bloquear o SSR) */}
        <div className="mb-8">
          <Suspense fallback={<Esqueleto className="h-20 w-full rounded-lg" />}>
            <FiltrosCatalogo categorias={categorias} />
          </Suspense>
        </div>

        {/* Grade de produtos */}
        <Suspense fallback={<EsqueletoGrade />}>
          <GradeProdutos produtos={produtos} buscaAtiva={temFiltros} />
        </Suspense>

      </div>
    </div>
  )
}
