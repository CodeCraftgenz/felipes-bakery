/**
 * Seção Ciclo de Entrega — Felipe's Bakery
 *
 * Explica de forma visual como funciona o ciclo de pedidos:
 *   Segunda a Quarta → Quarta 23h (corte) → Sexta (entrega)
 *
 * Inclui também um contador mostrando se ainda está no prazo.
 * Server Component.
 */

import React    from 'react'
import Link     from 'next/link'
import { CalendarClock, PackageCheck, Wheat, ShoppingBag } from 'lucide-react'
import type { ConfiguracoesLoja } from '@backend/modulos/configuracoes/queries'

// ── Mapa de nome dos dias ─────────────────────────────────────
const NOMES_DIA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// ── Props ─────────────────────────────────────────────────────
interface PropsSecaoCicloEntrega {
  configuracoes: ConfiguracoesLoja
}

// ── Passos do ciclo ───────────────────────────────────────────
const passos = [
  {
    icone: <ShoppingBag className="h-6 w-6" />,
    titulo: 'Faça seu pedido',
    descricao: 'Escolha seus pães favoritos no cardápio e monte seu pedido.',
  },
  {
    icone: <CalendarClock className="h-6 w-6" />,
    titulo: 'Prazo de pedidos',
    descricao: 'Pedidos aceitos até quarta-feira às 23h para entrega na semana.',
  },
  {
    icone: <Wheat className="h-6 w-6" />,
    titulo: 'Produção artesanal',
    descricao: 'Pães preparados com fermentação natural e ingredientes frescos.',
  },
  {
    icone: <PackageCheck className="h-6 w-6" />,
    titulo: 'Entrega na sexta',
    descricao: 'Seu pedido chegue fresquinho na sexta-feira.',
  },
]

// ── Componente ────────────────────────────────────────────────
export function SecaoCicloEntrega({ configuracoes }: PropsSecaoCicloEntrega) {
  const diaCorteNome    = NOMES_DIA[configuracoes.diaCorte]    ?? 'Quarta'
  const diaEntregaNome  = NOMES_DIA[configuracoes.diaEntrega]  ?? 'Sexta'

  return (
    <section id="como-funciona" className="bg-stone-900 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Cabeçalho */}
        <div className="mb-12 text-center">
          <h2 className="font-playfair text-3xl font-bold text-white sm:text-4xl">
            Como Funciona
          </h2>
          <p className="mt-3 text-stone-400">
            Pedidos semanais com entrega garantida
          </p>

          {/* Ciclo visual resumido */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-brand-400/30 bg-brand-500/10 px-6 py-2.5">
            <span className="text-sm font-medium text-brand-200">
              Peça até{' '}
              <strong className="text-brand-400">
                {diaCorteNome} às {configuracoes.horaCorte}h
              </strong>
            </span>
            <span className="text-stone-600">→</span>
            <span className="text-sm font-medium text-brand-200">
              Receba na{' '}
              <strong className="text-brand-400">{diaEntregaNome}</strong>
            </span>
          </div>
        </div>

        {/* Passos do ciclo */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, indice) => (
            <div key={indice} className="relative flex flex-col items-center text-center">
              {/* Número do passo */}
              <div className="mb-4 flex items-center justify-center">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                  {passo.icone}
                  {/* Número */}
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {indice + 1}
                  </span>
                </div>
              </div>

              {/* Conteúdo */}
              <h3 className="text-base font-semibold text-white">{passo.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">{passo.descricao}</p>

              {/* Linha conectora (exceto no último) */}
              {indice < passos.length - 1 && (
                <div className="absolute left-[calc(50%+28px)] top-7 hidden h-px w-[calc(100%-56px)] border-t border-dashed border-stone-700 lg:block" />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/catalogo"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-500 px-8 text-base font-medium text-white shadow-lg transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          >
            Fazer Meu Pedido
          </Link>
        </div>

      </div>
    </section>
  )
}
