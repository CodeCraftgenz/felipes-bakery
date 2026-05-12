/**
 * GerenciadorEstoqueProduto — Felipe's Bakery Admin
 *
 * Ajusta o estoque de um produto direto da página de edição.
 * Suporta três operações:
 *   - Entrada: adiciona N unidades (ex: recebimento de produção)
 *   - Saída:   remove N unidades (ex: perda, quebra)
 *   - Ajuste:  define o estoque para o valor exato
 *
 * Cada movimentação registra o motivo para auditoria.
 */

'use client'

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { toast }      from 'sonner'
import { Loader2, Plus, Minus, RefreshCw, Boxes, AlertTriangle } from 'lucide-react'
import { Botao, Entrada, Rotulo } from '@frontend/compartilhado/ui'

type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'

interface Props {
  produtoId:     number
  quantidade:    number
  alertaMinimo:  number
}

export function GerenciadorEstoqueProduto({
  produtoId,
  quantidade,
  alertaMinimo,
}: Props) {
  const router = useRouter()
  const [tipo, setTipo]               = useState<TipoMovimentacao>('entrada')
  const [valor, setValor]             = useState<number>(1)
  const [motivo, setMotivo]           = useState('')
  const [carregando, setCarregando]   = useState(false)

  const emAlerta = quantidade <= alertaMinimo

  async function submeter() {
    if (valor < 1) {
      toast.error('Informe uma quantidade maior que zero')
      return
    }

    const motivoFinal = motivo.trim() || motivoPadrao(tipo)

    setCarregando(true)
    try {
      const res = await fetch('/api/admin/estoque/ajustar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          produtoId,
          tipo,
          quantidade: valor,
          motivo:     motivoFinal,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.erro ?? 'Erro ao ajustar estoque')
        return
      }
      toast.success('Estoque atualizado!')
      setValor(1)
      setMotivo('')
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Estoque
      </h2>

      {/* Indicador de estoque atual */}
      <div className={`mb-4 flex items-center justify-between rounded-lg border p-4 ${
        emAlerta
          ? 'border-amber-200 bg-amber-50'
          : 'border-stone-200 bg-stone-50'
      }`}>
        <div className="flex items-center gap-3">
          {emAlerta
            ? <AlertTriangle className="h-5 w-5 text-amber-600" />
            : <Boxes        className="h-5 w-5 text-brand-600" />}
          <div>
            <p className="text-sm text-muted-foreground">Estoque atual</p>
            <p className="text-2xl font-bold text-stone-900">{quantidade} un.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Alerta mínimo</p>
          <p className="text-sm font-medium text-stone-700">{alertaMinimo} un.</p>
          {emAlerta && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Estoque baixo!
            </p>
          )}
        </div>
      </div>

      {/* Seletor de tipo */}
      <Rotulo>Tipo de movimentação</Rotulo>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {(
          [
            { v: 'entrada' as const, label: 'Entrada', Icon: Plus },
            { v: 'saida'   as const, label: 'Saída',   Icon: Minus },
            { v: 'ajuste'  as const, label: 'Ajuste',  Icon: RefreshCw },
          ]
        ).map(({ v, label, Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => setTipo(v)}
            className={[
              'flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
              tipo === v
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-input text-muted-foreground hover:bg-stone-50',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {tipo === 'entrada' && 'Adiciona a quantidade ao estoque atual.'}
        {tipo === 'saida'   && 'Remove a quantidade do estoque atual.'}
        {tipo === 'ajuste'  && 'Define o estoque para o valor informado (uso em inventário).'}
      </p>

      {/* Quantidade + motivo */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Rotulo htmlFor="quantidade-mov">Quantidade *</Rotulo>
          <Entrada
            id="quantidade-mov"
            type="number"
            min={1}
            value={valor}
            onChange={(e) => setValor(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <Rotulo htmlFor="motivo-mov">Motivo (opcional)</Rotulo>
          <Entrada
            id="motivo-mov"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={motivoPadrao(tipo)}
          />
        </div>
      </div>

      {/* Preview do resultado */}
      <p className="mt-3 text-xs text-stone-600">
        Após a operação, o estoque será:{' '}
        <strong className="text-stone-900">
          {calcularPrevisao(tipo, quantidade, valor)} un.
        </strong>
      </p>

      <div className="mt-4 flex justify-end">
        <Botao type="button" onClick={submeter} disabled={carregando}>
          {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aplicar movimentação
        </Botao>
      </div>
    </section>
  )
}

function motivoPadrao(tipo: TipoMovimentacao): string {
  if (tipo === 'entrada') return 'Recebimento de produção'
  if (tipo === 'saida')   return 'Saída avulsa / perda'
  return 'Inventário manual'
}

function calcularPrevisao(
  tipo:       TipoMovimentacao,
  atual:      number,
  variacao:   number,
): number {
  if (tipo === 'entrada') return atual + variacao
  if (tipo === 'saida')   return Math.max(0, atual - variacao)
  return variacao
}
