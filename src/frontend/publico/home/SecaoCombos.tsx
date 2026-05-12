/**
 * SecaoCombos — Felipe's Bakery
 *
 * Faixa de destaque de combos sazonais ativos.
 * Exibe um card por combo com preço promocional, economia e lista de produtos.
 * Server-safe (sem hooks de cliente).
 */

import Link from 'next/link'
import Image from 'next/image'
import { Gift, ArrowRight } from 'lucide-react'
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

function tituloPorTema(tema: string): string {
  const mapa: Record<string, string> = {
    natal:     'Especial de Natal',
    pascoa:    'Especial de Páscoa',
    mae:       'Dia das Mães',
    pai:       'Dia dos Pais',
    namorados: 'Dia dos Namorados',
    geral:     'Combos em Destaque',
  }
  return mapa[tema] ?? mapa.geral
}

export function SecaoCombos({ combos }: Props) {
  if (combos.length === 0) return null

  // Agrupa por tema para mostrar um cabeçalho temático coerente
  const tema = combos[0].tema

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        {/* Cabeçalho temático */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <Gift className="h-3 w-3" /> Edição Limitada
          </span>
          <h2 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
            {tituloPorTema(tema)}
          </h2>
          <p className="mt-2 max-w-xl text-stone-600">
            Combos especiais com economia para você presentear ou aproveitar
            uma data marcante com sabor de padaria artesanal.
          </p>
        </div>

        {/* Grid de combos */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((c) => {
            const economia = c.precoOriginal
              ? Number(c.precoOriginal) - Number(c.preco)
              : 0
            return (
              <article
                key={c.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br ${gradientePorTema(c.tema)} shadow-sm transition-shadow hover:shadow-md`}
              >
                {/* Imagem do combo */}
                {c.urlImagem && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/50">
                    <Image
                      src={c.urlImagem}
                      alt={c.nome}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    {economia > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow">
                        Economize {formatarMoeda(economia)}
                      </span>
                    )}
                  </div>
                )}

                {/* Conteúdo */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-xl font-semibold text-stone-900 leading-tight">
                    {c.nome}
                  </h3>

                  {c.descricao && (
                    <p className="mt-2 text-sm text-stone-600 line-clamp-2">
                      {c.descricao}
                    </p>
                  )}

                  {/* Lista de produtos do combo */}
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

                  {/* Preço e CTA */}
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
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 w-full"
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
