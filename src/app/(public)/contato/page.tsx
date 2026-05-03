/**
 * Página de Contato — Felipe's Bakery
 *
 * Informações de contato e formulário para envio de mensagens.
 * Server Component estático com revalidação a cada hora.
 */

import type { Metadata }    from 'next'
import Link                  from 'next/link'
import { FormularioContato } from './FormularioContato'

// ── Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Contato | Felipe's Bakery",
  description:
    "Entre em contato com a Felipe's Bakery. WhatsApp, e-mail ou formulário — respondemos em até 24 horas.",
}

// ── Revalidação ISR ───────────────────────────────────────────
export const revalidate = 3600

// ── Página ────────────────────────────────────────────────────
export default function PaginaContato() {
  return (
    <div className="min-h-screen bg-cream">

      {/* ── Cabeçalho da Página ──────────────────────────────── */}
      <section className="bg-cream-100 py-14 sm:py-16 border-b border-cream-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-sans text-sm font-semibold uppercase tracking-widest text-brand-500 mb-3">
            Estamos aqui para ajudar
          </p>
          <h1 className="font-playfair text-4xl font-bold text-brand-950 sm:text-5xl">
            Contato
          </h1>
          <p className="mt-4 text-stone-600 max-w-xl mx-auto text-lg">
            Dúvidas, pedidos especiais ou sugestões? Fale com a gente pelo canal que preferir.
          </p>
        </div>
      </section>

      {/* ── Layout de Duas Colunas ───────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">

            {/* ── Coluna Esquerda: Informações de Contato ───── */}
            <div className="space-y-6">
              <h2 className="font-playfair text-2xl font-bold text-brand-950">
                Informações
              </h2>

              {/* Card WhatsApp */}
              <div className="flex items-start gap-4 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                  📱
                </div>
                <div>
                  <p className="font-semibold text-brand-950 mb-1">WhatsApp</p>
                  <Link
                    href="https://wa.me/5516997684430"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
                  >
                    (16) 99768-4430
                  </Link>
                  <p className="mt-1 text-sm text-stone-500">
                    Canal preferencial — respondemos mais rápido por aqui.
                  </p>
                </div>
              </div>

              {/* Card E-mail */}
              <div className="flex items-start gap-4 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                  📧
                </div>
                <div>
                  <p className="font-semibold text-brand-950 mb-1">E-mail</p>
                  <a
                    href="mailto:contato@felipesbakery.com.br"
                    className="text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
                  >
                    contato@felipesbakery.com.br
                  </a>
                  <p className="mt-1 text-sm text-stone-500">
                    Respondemos em até 24 horas úteis.
                  </p>
                </div>
              </div>

              {/* Card Horário */}
              <div className="flex items-start gap-4 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                  🕐
                </div>
                <div>
                  <p className="font-semibold text-brand-950 mb-1">Ciclo de Pedidos</p>
                  <p className="text-stone-700 font-medium">
                    Pedidos aceitos até quarta-feira
                  </p>
                  <p className="text-stone-700">Entrega na sexta-feira</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Produção artesanal sob encomenda — sem estoque, sempre fresco.
                  </p>
                </div>
              </div>

              {/* Card Localização */}
              <div className="flex items-start gap-4 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                  📍
                </div>
                <div>
                  <p className="font-semibold text-brand-950 mb-1">Localização</p>
                  <p className="text-stone-700">São Paulo, SP</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Atendemos com entrega na região. Consulte disponibilidade pelo WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Coluna Direita: Formulário ─────────────────── */}
            <div>
              <h2 className="font-playfair text-2xl font-bold text-brand-950 mb-6">
                Envie uma Mensagem
              </h2>

              <FormularioContato />
            </div>

          </div>
        </div>
      </section>

      {/* ── Seção CTA WhatsApp ───────────────────────────────── */}
      <section className="bg-cream-200 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white border border-cream-300 shadow-card px-8 py-12 text-center sm:px-12">
            <div className="text-5xl mb-5">💬</div>
            <h2 className="font-playfair text-2xl font-bold text-brand-950 sm:text-3xl">
              Prefere conversar pelo WhatsApp?
            </h2>
            <p className="mt-4 text-stone-600 max-w-lg mx-auto">
              É o jeito mais rápido e fácil. Tire dúvidas, faça seu pedido ou mande uma mensagem —
              respondemos com agilidade.
            </p>
            <Link
              href="https://wa.me/5516997684430"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-8 py-4 font-semibold text-white shadow-card transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              Abrir WhatsApp
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
