/**
 * SecaoCupons — Felipe's Bakery
 *
 * Vitrine de cupons ativos para o cliente "pegar" (copiar e usar no checkout).
 * O admin controla a visibilidade simplesmente criando/ativando/desativando
 * cupons no painel.
 *
 * Cupons de lote (uso único) NÃO aparecem aqui — eles são distribuídos
 * de forma privada (e-mail, WhatsApp, etc.).
 */

'use client'

import { useState }              from 'react'
import { toast }                 from 'sonner'
import { Copy, Check, Ticket }   from 'lucide-react'
import type { CupomPublico }     from '@backend/modulos/cupons/queries'

interface Props {
  cupons: CupomPublico[]
}

function formatarValor(c: CupomPublico): string {
  if (c.tipo === 'percentual') return `${parseFloat(c.valor)}% OFF`
  return `R$ ${parseFloat(c.valor).toFixed(2).replace('.', ',')} OFF`
}

function formatarMoeda(valor: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(parseFloat(valor))
}

export function SecaoCupons({ cupons }: Props) {
  const [codigoCopiado, setCopiado] = useState<string | null>(null)

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(codigo)
      toast.success(`Cupom ${codigo} copiado! Use no checkout.`)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      toast.error('Não foi possível copiar o código')
    }
  }

  if (cupons.length === 0) return null

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-br from-brand-50 to-cream-100">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <Ticket className="h-3 w-3" /> Cupons Ativos
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 sm:text-3xl">
            Pegue seu cupom de desconto
          </h2>
          <p className="mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
            Clique no código para copiar e use na finalização do pedido.
          </p>
        </div>

        {/* Grid de cupons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cupons.map((c) => {
            const copiado = codigoCopiado === c.codigo
            return (
              <button
                key={c.codigo}
                onClick={() => copiarCodigo(c.codigo)}
                className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-dashed border-brand-300 bg-white p-5 text-left transition-all hover:border-brand-500 hover:shadow-md"
              >
                {/* Recortes de "ticket" */}
                <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-brand-50 sm:bg-cream-100" />
                <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-brand-50 sm:bg-cream-100" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-2xl font-bold text-brand-600">
                      {formatarValor(c)}
                    </span>
                    {c.descricao && (
                      <p className="mt-1 text-sm text-stone-600 line-clamp-2">
                        {c.descricao}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-100 p-2 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </span>
                </div>

                {/* Código */}
                <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm font-bold tracking-wider text-stone-900 text-center group-hover:bg-brand-50 group-hover:border-brand-300 transition-colors">
                  {c.codigo}
                </div>

                {/* Detalhes */}
                <div className="mt-3 space-y-0.5 text-xs text-stone-500">
                  {c.valorMinimoPedido && (
                    <p>Pedido mínimo: {formatarMoeda(c.valorMinimoPedido)}</p>
                  )}
                  {c.validoAte && (
                    <p>
                      Válido até{' '}
                      {new Date(c.validoAte).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
