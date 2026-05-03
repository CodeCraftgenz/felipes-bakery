/**
 * Seção Categorias — Felipe's Bakery
 *
 * Exibe as categorias do cardápio como cards clicáveis na Home.
 * Cada card leva ao catálogo filtrado por categoria.
 *
 * Server Component.
 */

import React    from 'react'
import Link     from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { CategoriaResumo } from '@backend/modulos/categorias/queries'

// ── Ícones e descrições visuais por categoria ─────────────────
// (personalizados para a identidade da padaria)
const VISUAL_CATEGORIA: Record<string, { emoji: string; descricaoBreve: string }> = {
  'paes-rusticos': {
    emoji:        '🍞',
    descricaoBreve: 'Fermentação natural, crosta crocante',
  },
  'semi-integral': {
    emoji:        '🌾',
    descricaoBreve: 'Textura macia, notas tostadas',
  },
  'folhado-artesanal': {
    emoji:        '🥐',
    descricaoBreve: 'Croissants com manteiga de qualidade',
  },
}

// ── Props ─────────────────────────────────────────────────────
interface PropsSecaoCategorias {
  categorias: CategoriaResumo[]
}

// ── Componente ────────────────────────────────────────────────
export function SecaoCategorias({ categorias }: PropsSecaoCategorias) {
  if (categorias.length === 0) return null

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Título da seção */}
        <div className="mb-10 text-center">
          <h2 className="font-playfair text-3xl font-bold text-stone-900 sm:text-4xl">
            Nosso Cardápio
          </h2>
          <p className="mt-3 text-stone-500">
            Escolha sua categoria favorita
          </p>
        </div>

        {/* Grid de categorias */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((cat) => {
            const visual = VISUAL_CATEGORIA[cat.slug] ?? {
              emoji: '🥖',
              descricaoBreve: cat.descricao ?? '',
            }

            return (
              <Link
                key={cat.id}
                href={`/catalogo?categoria=${cat.slug}`}
                className="group relative flex flex-col rounded-2xl border border-stone-200 bg-cream p-7 transition-all duration-200 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {/* Emoji da categoria */}
                <span className="mb-4 text-4xl" aria-hidden="true">
                  {visual.emoji}
                </span>

                {/* Nome e descrição breve */}
                <h3 className="font-playfair text-xl font-semibold text-stone-900 group-hover:text-brand-700 transition-colors">
                  {cat.nome}
                </h3>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed flex-1">
                  {visual.descricaoBreve || cat.descricao}
                </p>

                {/* CTA */}
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-brand-600">
                  Ver produtos
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>

                {/* Borda de destaque no hover */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl bg-brand-500 scale-x-0 transition-transform group-hover:scale-x-100" />
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}
