/**
 * Página de detalhe de Combo — Felipe's Bakery
 *
 * Página pública de um combo sazonal específico.
 * Mostra: imagem grande, descrição completa, lista de produtos
 * incluídos, preço e CTA para encomendar via WhatsApp.
 */

import type { Metadata }      from 'next'
import { notFound }           from 'next/navigation'
import Image                  from 'next/image'
import Link                   from 'next/link'
import { ArrowLeft, Gift, MessageCircle } from 'lucide-react'
import { buscarComboPorSlug } from '@backend/modulos/combos/queries'
import { buscarConfiguracoes } from '@backend/modulos/configuracoes/queries'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const combo = await buscarComboPorSlug(params.slug).catch(() => null)
  if (!combo) return { title: 'Combo não encontrado' }
  return {
    title:       combo.nome,
    description: combo.descricao ?? `Combo ${combo.nome} — Felipe's Bakery`,
  }
}

function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(Number(valor))
}

export default async function PaginaCombo({ params }: Props) {
  const combo = await buscarComboPorSlug(params.slug)
  if (!combo || !combo.ativo) notFound()

  const config = await buscarConfiguracoes().catch(() => null)
  const whatsapp = config?.whatsapp ?? '5516997684430'
  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no combo "${combo.nome}" (${formatarMoeda(combo.preco)}). Como faço para encomendar?`,
  )
  const linkWhatsapp = `https://wa.me/${whatsapp}?text=${mensagem}`

  const economia = combo.precoOriginal
    ? Number(combo.precoOriginal) - Number(combo.preco)
    : 0

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Voltar */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Imagem */}
          <div className="overflow-hidden rounded-2xl bg-stone-100">
            {combo.urlImagem ? (
              <div className="relative aspect-square">
                <Image
                  src={combo.urlImagem}
                  alt={combo.nome}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-brand-50">
                <Gift className="h-24 w-24 text-brand-300" />
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Gift className="h-3 w-3" /> Combo Sazonal
            </span>

            <h1 className="mt-3 font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
              {combo.nome}
            </h1>

            {combo.descricao && (
              <p className="mt-3 text-stone-600 leading-relaxed">{combo.descricao}</p>
            )}

            {/* Preço */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-stone-900">
                {formatarMoeda(combo.preco)}
              </span>
              {combo.precoOriginal && Number(combo.precoOriginal) > Number(combo.preco) && (
                <>
                  <span className="text-lg text-stone-400 line-through">
                    {formatarMoeda(combo.precoOriginal)}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Economize {formatarMoeda(economia)}
                  </span>
                </>
              )}
            </div>

            {/* Itens incluídos */}
            <div className="mt-6 rounded-xl border border-stone-200 p-5">
              <h2 className="font-serif text-lg font-semibold text-stone-900">
                Itens incluídos
              </h2>
              <ul className="mt-3 space-y-2">
                {combo.itens.map((item) => (
                  <li
                    key={item.produtoId}
                    className="flex items-center gap-3 text-sm text-stone-700"
                  >
                    {item.urlImagem && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        <Image
                          src={item.urlImagem}
                          alt={item.nome}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="font-medium text-stone-900">{item.nome}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                      {item.quantidade}× un.
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-5 w-5" />
              Encomendar pelo WhatsApp
            </a>

            {combo.validoAte && (
              <p className="mt-3 text-center text-xs text-stone-500">
                Combo válido até{' '}
                {new Date(combo.validoAte).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
