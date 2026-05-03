/**
 * ModalAjusteEstoque — Felipe's Bakery Admin
 *
 * Modal de ajuste de estoque com tipo (entrada/saída/ajuste) e motivo.
 * Client Component.
 */

'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { toast }          from 'sonner'
import { useTransition }  from 'react'
import { Loader2 }        from 'lucide-react'
import {
  Dialogo, DialogoConteudo, DialogoCabecalho, DialogoTitulo,
  DialogoDescricao, DialogoRodape, Botao, Rotulo, Entrada,
} from '@frontend/compartilhado/ui'
import type { ItemEstoque } from '@backend/modulos/estoque/queries'

interface ModalAjusteEstoqueProps {
  item:     ItemEstoque
  aberto:   boolean
  aoFechar: () => void
}

export function ModalAjusteEstoque({ item, aberto, aoFechar }: ModalAjusteEstoqueProps) {
  const router              = useRouter()
  const [isPending, startT] = useTransition()

  const [tipo,       setTipo]       = useState<'entrada' | 'saida' | 'ajuste'>('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [motivo,     setMotivo]     = useState('')

  function fechar() {
    setTipo('entrada')
    setQuantidade('')
    setMotivo('')
    aoFechar()
  }

  async function confirmar() {
    const qtd = Number(quantidade)
    if (!qtd || qtd <= 0) {
      toast.error('Informe uma quantidade válida')
      return
    }
    if (!motivo.trim()) {
      toast.error('Informe o motivo do ajuste')
      return
    }

    const res = await fetch('/api/admin/estoque/ajustar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produtoId:  item.produtoId,
        tipo,
        quantidade: qtd,
        motivo:     motivo.trim(),
      }),
    })

    if (res.ok) {
      toast.success('Estoque atualizado!')
      startT(() => router.refresh())
      fechar()
    } else {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao ajustar estoque')
    }
  }

  // Calcula prévia da nova quantidade
  function calcularPrevia(): number {
    const qtd = Number(quantidade) || 0
    if (tipo === 'entrada') return item.quantidade + qtd
    if (tipo === 'saida')   return Math.max(0, item.quantidade - qtd)
    return Math.max(0, qtd) // ajuste absoluto
  }

  return (
    <Dialogo open={aberto} onOpenChange={(o) => { if (!o) fechar() }}>
      <DialogoConteudo className="max-w-md">
        <DialogoCabecalho>
          <DialogoTitulo>Ajustar Estoque</DialogoTitulo>
          <DialogoDescricao>
            <strong>{item.nomeProduto}</strong> — estoque atual:{' '}
            <strong>{item.quantidade}</strong> unidades
            {item.emAlerta && (
              <span className="ml-2 text-red-500">(⚠ abaixo do mínimo)</span>
            )}
          </DialogoDescricao>
        </DialogoCabecalho>

        <div className="space-y-4 py-2">
          {/* Tipo de movimentação */}
          <div>
            <Rotulo>Tipo</Rotulo>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(['entrada', 'saida', 'ajuste'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={[
                    'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    tipo === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-input text-muted-foreground hover:bg-stone-50',
                  ].join(' ')}
                >
                  {t === 'entrada' ? 'Entrada' : t === 'saida' ? 'Saída' : 'Ajuste'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {tipo === 'entrada' && 'Adiciona a quantidade ao estoque atual'}
              {tipo === 'saida'   && 'Remove a quantidade do estoque atual'}
              {tipo === 'ajuste'  && 'Define o estoque para o valor exato informado'}
            </p>
          </div>

          {/* Quantidade */}
          <div>
            <Rotulo htmlFor="quantidade">Quantidade</Rotulo>
            <Entrada
              id="quantidade"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 10"
            />
            {quantidade && (
              <p className="mt-1 text-xs text-muted-foreground">
                Novo estoque:{' '}
                <strong className={calcularPrevia() <= item.alertaMinimo ? 'text-red-600' : 'text-foreground'}>
                  {calcularPrevia()} unidades
                </strong>
              </p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <Rotulo htmlFor="motivo">Motivo *</Rotulo>
            <Entrada
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Recebimento fornecedor / Correção de contagem"
            />
          </div>
        </div>

        <DialogoRodape>
          <Botao variante="contorno" onClick={fechar}>
            Cancelar
          </Botao>
          <Botao onClick={confirmar} disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Confirmar
          </Botao>
        </DialogoRodape>
      </DialogoConteudo>
    </Dialogo>
  )
}
