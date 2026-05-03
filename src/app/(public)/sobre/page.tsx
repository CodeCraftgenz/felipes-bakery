/**
 * Página Nossa História — Felipe's Bakery
 *
 * Conta a história da padaria, os valores da marca e o processo artesanal.
 * Server Component estático com revalidação a cada hora.
 */

import type { Metadata } from 'next'
import Link              from 'next/link'

// ── Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Nossa História | Felipe's Bakery",
  description:
    "Conheça a história da Felipe's Bakery — uma padaria artesanal nascida da paixão pela fermentação natural e pelo pão feito com cuidado e ingredientes selecionados.",
}

// ── Revalidação ISR ───────────────────────────────────────────
export const revalidate = 3600

// ── Página ────────────────────────────────────────────────────
export default function PaginaSobre() {
  return (
    <div className="min-h-screen bg-cream">

      {/* ── Seção Hero ──────────────────────────────────────── */}
      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-sans text-sm font-semibold uppercase tracking-widest text-brand-500 mb-3">
            Desde o começo, com paixão
          </p>
          <h1 className="font-playfair text-4xl font-bold text-brand-950 sm:text-5xl lg:text-6xl">
            Nossa História
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-stone-600 leading-relaxed">
            Uma história que começa com farinha, água, sal — e a convicção de que o pão verdadeiro
            precisa de tempo, cuidado e fermentação natural.
          </p>

          {/* Divider decorativo */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-brand-300" />
            <span className="text-brand-400 text-xl">🌾</span>
            <div className="h-px w-16 bg-brand-300" />
          </div>
        </div>
      </section>

      {/* ── Seção História ──────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">

            {/* Texto da história */}
            <div className="space-y-6">
              <h2 className="font-playfair text-3xl font-bold text-brand-950 sm:text-4xl">
                Como tudo começou
              </h2>
              <p className="text-stone-600 leading-relaxed text-lg">
                Felipe sempre teve uma relação especial com a cozinha. Cresceu vendo a avó preparar
                pão todos os dias, sentindo o aroma que tomava conta da casa e entendendo, ainda
                criança, que o pão é muito mais do que alimento — é afeto.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Após anos aperfeiçoando a técnica de fermentação natural, Felipe decidiu transformar
                a paixão em ofício. A padaria nasceu em uma cozinha pequena, com uma única fornada
                por semana e clientes que eram, antes de tudo, amigos e vizinhos que acreditaram
                na proposta.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Hoje, o processo continua o mesmo: cada pão passa por mais de 18 horas de fermentação
                lenta antes de chegar ao forno. Não há atalhos. O fermento natural precisa de tempo —
                e nós respeitamos esse ritmo porque é justamente ele que cria sabor, textura e o
                inconfundível aroma que marca cada fatia.
              </p>
              <p className="text-stone-600 leading-relaxed">
                A Felipe&apos;s Bakery é uma padaria de ciclo semanal: recebemos pedidos até
                quarta-feira e entregamos na sexta. Isso garante que cada pão seja feito sob encomenda,
                fresco, sem sobras e sem desperdício.
              </p>
            </div>

            {/* Elemento decorativo */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="rounded-3xl bg-brand-950 p-10 text-center shadow-card">
                  <p className="font-playfair text-6xl font-bold text-brand-300 leading-none">18h+</p>
                  <p className="mt-3 font-playfair text-xl text-cream-100">de fermentação lenta</p>
                  <div className="my-6 h-px bg-brand-700" />
                  <p className="text-sm text-stone-400 leading-relaxed">
                    Cada pão descansa e desenvolve sabor por mais de 18 horas antes de ir ao forno.
                    Esse é o segredo da crosta crocante e do miolo aberto.
                  </p>
                </div>
                {/* Detalhe decorativo atrás do card */}
                <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-brand-200" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Seção Valores ────────────────────────────────────── */}
      <section className="bg-cream-200 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-brand-950 sm:text-4xl">
              Nossos Valores
            </h2>
            <p className="mt-4 text-stone-600 max-w-xl mx-auto">
              Princípios que guiam cada pão que sai do nosso forno.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">

            {/* Valor 1 */}
            <div className="rounded-2xl bg-white p-8 shadow-card text-center">
              <div className="text-4xl mb-4">🌾</div>
              <h3 className="font-playfair text-xl font-bold text-brand-950 mb-3">
                Fermentação Natural
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Usamos exclusivamente fermento natural (levain) cultivado na própria padaria.
                Sem fermento industrial, sem pressa — apenas o tempo fazendo seu trabalho.
              </p>
            </div>

            {/* Valor 2 */}
            <div className="rounded-2xl bg-white p-8 shadow-card text-center">
              <div className="text-4xl mb-4">🧈</div>
              <h3 className="font-playfair text-xl font-bold text-brand-950 mb-3">
                Ingredientes Selecionados
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Farinha orgânica, manteiga de qualidade premium, azeites importados — cada
                ingrediente é escolhido a dedo porque acreditamos que o resultado final depende
                do que colocamos no começo.
              </p>
            </div>

            {/* Valor 3 */}
            <div className="rounded-2xl bg-white p-8 shadow-card text-center">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="font-playfair text-xl font-bold text-brand-950 mb-3">
                Feito com Amor
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Produção artesanal em pequenos lotes, sob encomenda. Cada pão é modelado à mão
                e tratado como único — porque para nós, padaria boa é aquela que conhece cada
                cliente pelo nome.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Seção Processo ───────────────────────────────────── */}
      <section className="bg-brand-950 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-cream-100 sm:text-4xl">
              Do Grão ao Forno
            </h2>
            <p className="mt-4 text-stone-400 max-w-xl mx-auto">
              O processo artesanal que garante a qualidade de cada pão.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">

            {/* Passo 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-playfair text-xl font-bold text-white">
                1
              </div>
              <h3 className="font-playfair text-lg font-semibold text-cream-100 mb-2">
                Seleção dos Ingredientes
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Farinha, água e sal selecionados com critério. A qualidade começa aqui.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-playfair text-xl font-bold text-white">
                2
              </div>
              <h3 className="font-playfair text-lg font-semibold text-cream-100 mb-2">
                Mistura e Autólise
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Farinha e água descansam juntas para desenvolver a estrutura do glúten naturalmente.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-playfair text-xl font-bold text-white">
                3
              </div>
              <h3 className="font-playfair text-lg font-semibold text-cream-100 mb-2">
                Fermentação Lenta (18h+)
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                A massa fermenta lentamente em temperatura controlada, desenvolvendo sabor e aroma únicos.
              </p>
            </div>

            {/* Passo 4 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-playfair text-xl font-bold text-white">
                4
              </div>
              <h3 className="font-playfair text-lg font-semibold text-cream-100 mb-2">
                Modelagem Artesanal
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Cada unidade é modelada à mão, garantindo formato e textura ideais.
              </p>
            </div>

            {/* Passo 5 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-playfair text-xl font-bold text-white">
                5
              </div>
              <h3 className="font-playfair text-lg font-semibold text-cream-100 mb-2">
                Assado no Forno a Lenha
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Temperatura alta e vapor criam a crosta crocante e o miolo macio que nos define.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Seção CTA ────────────────────────────────────────── */}
      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-playfair text-3xl font-bold text-brand-950 sm:text-4xl">
            Experimente nossos pães
          </h2>
          <p className="mt-4 text-stone-600 max-w-lg mx-auto text-lg">
            Peça até quarta-feira e receba na sexta. Pão artesanal fresco, feito especialmente para você.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-8 py-4 font-semibold text-white shadow-card transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Ver Cardápio Completo
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center rounded-xl border border-brand-300 bg-white px-8 py-4 font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Falar com a Padaria
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
