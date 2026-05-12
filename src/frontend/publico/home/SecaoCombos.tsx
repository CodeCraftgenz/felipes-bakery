/**
 * SecaoCombos — Felipe's Bakery
 *
 * Carrossel horizontal de combos sazonais ativos.
 * Mostra até 3 cards visíveis ao mesmo tempo (1 no mobile, 2 no tablet,
 * 3 no desktop) e expõe setas de navegação para rolar lateralmente
 * quando houver mais combos do que cabem na viewport.
 *
 * Client Component (precisa de ref + estado para o carrossel).
 */

'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Gift, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComboCompleto } from '@backend/modulos/combos/queries'

interface Props {
  combos: ComboCompleto[]
}

function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(Number(valor))
}

function gradientePorTema(tema: string): string {
  const mapa: Record<string, string> = {
    natal:     'from-red-50 via-emerald-50 to-red-50 border-red-200',
    pascoa:    'from-amber-50 via-pink-50 to-amber-50 border-amber-200',
    mae:       'from-pink-50 via-rose-50 to-pink-50 border-pink-200',
    pai:       'from-blue-50 via-indigo-50 to-blue-50 border-blue-200',
    namorados: 'from-rose-50 via-pink-50 to-rose-50 border-rose-200',
    geral:     'from-brand-50 via-cream-100 to-brand-50 border-brand-200',
  }
  return mapa[tema] ?? mapa.geral
}

function tituloDaSecao(combos: ComboCompleto[]): string {
  const temasUnicos = new Set(combos.map((c) => c.tema))
  if (temasUnicos.size !== 1) return 'Combos em Destaque'

  const tema = combos[0].tema
  const mapa: Record<string, string> = {
    natal:     'Especial de Natal',
    pascoa:    'Especial de Páscoa',
    mae:       'Dia das Mães',
    pai:       'Dia dos Pais',
    namorados: 'Dia dos Namorados',
    geral:     'Combos em Destaque',
  }
  return mapa[tema] ?? 'Combos em Destaque'
}

export function SecaoCombos({ combos }: Props) {
  const carrosselRef = useRef<HTMLDivElement>(null)
  const [podeVoltar, setPodeVoltar]     = useState(false)
  const [podeAvancar, setPodeAvancar]   = useState(false)

  function atualizarEstadoBotoes() {
    const el = carrosselRef.current
    if (!el) return
    setPodeVoltar(el.scrollLeft > 8)
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    atualizarEstadoBotoes()
    const el = carrosselRef.current
    if (!el) return
    el.addEventListener('scroll', atualizarEstadoBotoes, { passive: true })
    window.addEventListener('resize', atualizarEstadoBotoes)
    return () => {
      el.removeEventListener('scroll', atualizarEstadoBotoes)
      window.removeEventListener('resize', atualizarEstadoBotoes)
    }
  }, [combos.length])

  function rolar(direcao: 'esquerda' | 'direita') {
    const el = carrosselRef.current
    if (!el) return
    const cardWidth = el.querySelector<HTMLElement>('[data-combo-card]')?.offsetWidth ?? 320
    const gap = 24
    const passo = cardWidth + gap
    el.scrollBy({
      left:     direcao === 'esquerda' ? -passo : passo,
      behavior: 'smooth',
    })
  }

  if (combos.length === 0) return null

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4">
        {/* Cabeçalho com setas */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Gift className="h-3 w-3" /> Edição Limitada
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900 sm:text-3xl">
              {tituloDaSecao(combos)}
            </h2>
          </div>

          {combos.length > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => rolar('esquerda')}
                disabled={!podeVoltar}
                aria-label="Combo anterior"
                className="rounded-full border border-stone-200 bg-white p-2 text-stone-700 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => rolar('direita')}
                disabled={!podeAvancar}
                aria-label="Próximo combo"
                className="rounded-full border border-stone-200 bg-white p-2 text-stone-700 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carrossel: 1 card no mobile, 2 no sm, 3 no lg */}
        <div
          ref={carrosselRef}
          className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {combos.map((c) => {
            const economia = c.precoOriginal
              ? Number(c.precoOriginal) - Number(c.preco)
              : 0
            return (
              <article
                key={c.id}
                data-combo-card
                className={`flex shrink-0 snap-start basis-[85%] flex-col overflow-hidden rounded-2xl border bg-gradient-to-br ${gradientePorTema(c.tema)} shadow-sm transition-shadow hover:shadow-md sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]`}
              >
                {c.urlImagem && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/50">
                    <Image
                      src={c.urlImagem}
                      alt={c.nome}
                      fill
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    {economia > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow">
                        Economize {formatarMoeda(economia)}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-xl font-semibold text-stone-900 leading-tight">
                    {c.nome}
                  </h3>

                  {c.descricao && (
                    <p className="mt-2 text-sm text-stone-600 line-clamp-2">
                      {c.descricao}
                    </p>
                  )}

                  <ul className="mt-3 space-y-1 text-sm text-stone-700">
                    {c.itens.slice(0, 4).map((item) => (
                      <li key={item.produtoId} className="flex items-start gap-1.5">
                        <span className="text-brand-600">•</span>
                        <span>
                          <strong>{item.quantidade}×</strong> {item.nome}
                        </span>
                      </li>
                    ))}
                    {c.itens.length > 4 && (
                      <li className="text-xs text-stone-500">
                        + {c.itens.length - 4} produto(s)
                      </li>
                    )}
                  </ul>

                  <div className="mt-auto pt-4">
                    <div className="flex items-baseline gap-2">
                      {c.precoOriginal && Number(c.precoOriginal) > Number(c.preco) && (
                        <span className="text-sm text-stone-400 line-through">
                          {formatarMoeda(c.precoOriginal)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-stone-900">
                        {formatarMoeda(c.preco)}
                      </span>
                    </div>

                    <Link
                      href={`/combos/${c.slug}`}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Ver detalhes <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
