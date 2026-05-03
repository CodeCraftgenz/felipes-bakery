/**
 * Resumo do Carrinho (Sidebar de totais) — Felipe's Bakery
 *
 * Painel lateral direito da página do carrinho com:
 *   - Subtotal
 *   - Campo de cupom de desconto
 *   - Desconto aplicado
 *   - Total final
 *   - Botão de finalizar pedido
 *   - Info do ciclo de entrega
 *
 * Client Component.
 */

'use client'

import React          from 'react'
import Link           from 'next/link'
import { Tag, X, Loader2 } from 'lucide-react'
import { toast }      from 'sonner'
import { Botao }      from '@frontend/compartilhado/ui/botao'
import { Entrada }    from '@frontend/compartilhado/ui/entrada'
import { Separador }  from '@frontend/compartilhado/ui/separador'
import { useCarrinho } from '@frontend/compartilhado/stores/carrinho'
import { formatarMoeda } from '@compartilhado/utils'

// ── Componente ────────────────────────────────────────────────
export function ResumoCarrinho() {
  const { subtotal, valorDesconto, total, cupom, aplicarCupom, removerCupom } = useCarrinho()
  const [codigoCupom, setCodigoCupom] = React.useState('')
  const [validandoCupom, setValidandoCupom] = React.useState(false)

  const subtotalValor  = subtotal()
  const descontoValor  = valorDesconto()
  const totalValor     = total()
  const temDesconto    = descontoValor > 0

  // Valida o cupom via API
  const aoAplicarCupom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoCupom.trim()) return

    setValidandoCupom(true)
    try {
      const resposta = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo:   codigoCupom.trim().toUpperCase(),
          subtotal: subtotalValor,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        toast.error(dados.mensagem ?? 'Cupom inválido ou expirado')
        return
      }

      aplicarCupom({
        codigo:       dados.codigo,
        desconto:     dados.valorDesconto,
        tipo:         dados.tipo,
        porcentagem:  dados.porcentagem,
      })

      toast.success(`Cupom ${dados.codigo} aplicado!`, {
        description: `Você economizou ${formatarMoeda(dados.valorDesconto)}`,
      })
      setCodigoCupom('')
    } catch {
      toast.error('Não foi possível validar o cupom. Tente novamente.')
    } finally {
      setValidandoCupom(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5 sticky top-24">
      <h2 className="font-playfair text-xl font-semibold text-stone-900">
        Resumo do Pedido
      </h2>

      {/* Linhas de totais */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Subtotal</span>
          <span className="font-medium text-stone-900">{formatarMoeda(subtotalValor)}</span>
        </div>

        {/* Desconto */}
        {temDesconto && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto ({cupom?.codigo})</span>
            <span className="font-medium">− {formatarMoeda(descontoValor)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Frete</span>
          <span className="font-medium text-green-600">Grátis</span>
        </div>
      </div>

      <Separador />

      {/* Total */}
      <div className="flex justify-between">
        <span className="text-base font-semibold text-stone-900">Total</span>
        <span className="text-xl font-bold text-stone-900">{formatarMoeda(totalValor)}</span>
      </div>

      {/* Campo de cupom */}
      {cupom ? (
        // Cupom ativo — exibe e permite remover
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Tag className="h-4 w-4" />
            <span className="font-medium">{cupom.codigo}</span>
          </div>
          <button
            onClick={removerCupom}
            className="text-green-600 hover:text-green-800 transition-colors"
            aria-label="Remover cupom"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Campo para inserir cupom
        <form onSubmit={aoAplicarCupom} className="flex gap-2">
          <Entrada
            type="text"
            placeholder="Código do cupom"
            value={codigoCupom}
            onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
            className="flex-1 uppercase text-xs"
            maxLength={20}
            aria-label="Código do cupom de desconto"
          />
          <Botao
            type="submit"
            variante="contorno"
            tamanho="m"
            disabled={!codigoCupom.trim() || validandoCupom}
            className="shrink-0"
          >
            {validandoCupom ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Aplicar'
            )}
          </Botao>
        </form>
      )}

      {/* Botão de finalizar */}
      <Link href="/checkout" className="block">
        <Botao variante="padrao" tamanho="g" className="w-full">
          Finalizar Pedido
        </Botao>
      </Link>

      {/* Info do ciclo */}
      <p className="text-center text-xs text-stone-400 leading-relaxed">
        Pedidos aceitos até <strong className="text-stone-600">quarta-feira às 23h</strong>
        <br />
        Entrega na <strong className="text-stone-600">sexta-feira</strong>
      </p>
    </div>
  )
}
