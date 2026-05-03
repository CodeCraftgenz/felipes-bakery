/**
 * Seção Hero — Felipe's Bakery
 *
 * Banner principal da home com chamada para ação.
 * Exibe os banners cadastrados no painel admin ou um hero padrão.
 *
 * Estrutura visual:
 *   - Fundo: imagem do banner com overlay escuro
 *   - Título: fonte Playfair Display, grande
 *   - Subtítulo: descrição da padaria
 *   - CTAs: "Ver Cardápio" + "Como Funciona"
 *   - Badge: ciclo de pedidos (Peça até Qua, receba Sex)
 *
 * Server Component — recebe os banners como prop do servidor.
 */

import React    from 'react'
import Link     from 'next/link'
import Image    from 'next/image'
import type { BannerResumo } from '@backend/modulos/banners/queries'

// ── Props ─────────────────────────────────────────────────────
interface PropsSecaoHero {
  banners: BannerResumo[]
}

// ── Componente ────────────────────────────────────────────────
export function SecaoHero({ banners }: PropsSecaoHero) {
  // Usa o primeiro banner ou um placeholder
  const banner = banners[0]

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-stone-900">

      {/* Imagem de fundo */}
      {banner ? (
        <Image
          src={banner.urlImagem}
          alt={banner.titulo ?? "Felipe's Bakery"}
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
      ) : (
        // Gradiente como fallback enquanto não há imagem
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 opacity-90" />
      )}

      {/* Padrão decorativo (grain) */}
      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10" />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">

          {/* Badge: ciclo de pedidos */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-sm font-medium text-brand-200">
              Peça até quarta-feira · Entrega na sexta
            </span>
          </div>

          {/* Título principal */}
          <h1 className="font-playfair text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
            {banner?.titulo ?? (
              <>
                Pães artesanais de{' '}
                <span className="text-brand-400">fermentação natural</span>
              </>
            )}
          </h1>

          {/* Subtítulo — usa um texto institucional fixo, já que o banner
              só armazena título e imagem (sem campo de subtítulo no schema). */}
          <p className="mt-6 text-lg leading-relaxed text-stone-300 sm:text-xl">
            Feitos com ingredientes selecionados, fermento natural e muito
            cuidado. Cada pão conta uma história de dedicação artesanal.
          </p>

          {/* Botões de ação */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/catalogo"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-500 px-8 text-base font-medium text-white shadow-lg transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
            >
              Ver Cardápio
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Como Funciona
            </a>
          </div>

          {/* Itens do cardápio em destaque */}
          <div className="mt-12 flex flex-wrap gap-2">
            {['Pão Italiano', 'Ciabatta', 'Focaccia', 'Croissant', 'Kouign-amann'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-stone-300"
              >
                {item}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* Seta indicando scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

    </section>
  )
}
