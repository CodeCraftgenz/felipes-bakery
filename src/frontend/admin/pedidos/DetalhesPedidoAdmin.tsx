/**
 * DetalhesPedidoAdmin — Felipe's Bakery Admin
 *
 * Exibe os detalhes completos de um pedido: itens, endereço,
 * histórico de status e ações de atualização de status.
 * Client Component — para o botão de mudar status.
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { toast }                   from 'sonner'
import { Loader2, MapPin, Clock }  from 'lucide-react'
import {
  Cartao, CartaoCabecalho, CartaoTitulo, CartaoConteudo,
  Botao, Separador,
} from '@frontend/compartilhado/ui'
import { CrachaBadgeStatus }       from './CrachaBadgeStatus'
import type { PedidoDetalhado }    from '@backend/modulos/pedidos/queries'

// Status possíveis após o atual
const PROXIMOS_STATUS: Record<string, { valor: string; rotulo: string }[]> = {
  aguardando_pagamento: [],
  confirmado:    [{ valor: 'em_producao', rotulo: 'Iniciar Produção' }],
  em_producao:   [{ valor: 'pronto',      rotulo: 'Marcar como Pronto' }],
  pronto:        [{ valor: 'entregue',    rotulo: 'Confirmar Entrega'  }],
  entregue:      [],
  cancelado:     [],
}

function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(data))
}

interface DetalhesPedidoAdminProps {
  pedido: PedidoDetalhado
}

export function DetalhesPedidoAdmin({ pedido }: DetalhesPedidoAdminProps) {
  const router               = useRouter()
  const [isPending, startT]  = useTransition()
  const [observacao, setObs] = useState('')

  const proximosStatus = PROXIMOS_STATUS[pedido.status] ?? []

  async function atualizarStatus(novoStatus: string) {
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus, observacao: observacao || undefined }),
    })

    if (res.ok) {
      toast.success('Status atualizado!')
      setObs('')
      startT(() => router.refresh())
    } else {
      toast.error('Erro ao atualizar status')
    }
  }

  async function cancelarPedido() {
    if (!confirm('Cancelar este pedido? Esta ação não pode ser desfeita.')) return
    await atualizarStatus('cancelado')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Coluna principal */}
      <div className="space-y-5 lg:col-span-2">

        {/* Itens do pedido */}
        <Cartao>
          <CartaoCabecalho>
            <CartaoTitulo className="text-base">Itens do Pedido</CartaoTitulo>
          </CartaoCabecalho>
          <CartaoConteudo className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-right">Unit.</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pedido.itens.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium">{item.nomeProduto}</td>
                    <td className="px-4 py-3 text-center">{item.quantidade}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatarMoeda(item.precoUnitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatarMoeda(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-stone-50">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-700">
                    {formatarMoeda(pedido.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CartaoConteudo>
        </Cartao>

        {/* Histórico de status */}
        <Cartao>
          <CartaoCabecalho>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CartaoTitulo className="text-base">Histórico</CartaoTitulo>
            </div>
          </CartaoCabecalho>
          <CartaoConteudo>
            <ol className="space-y-3">
              {pedido.historico.map((h, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-400 ring-2 ring-brand-100" />
                  <div>
                    <div className="flex items-center gap-2">
                      <CrachaBadgeStatus status={h.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatarData(h.criadoEm)}
                      </span>
                    </div>
                    {h.nota && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{h.nota}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CartaoConteudo>
        </Cartao>
      </div>

      {/* Coluna lateral */}
      <div className="space-y-5">

        {/* Resumo + ações de status */}
        <Cartao>
          <CartaoCabecalho>
            <CartaoTitulo className="text-base">Status do Pedido</CartaoTitulo>
          </CartaoCabecalho>
          <CartaoConteudo className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status atual</span>
              <CrachaBadgeStatus status={pedido.status} />
            </div>

            {/* Observação para próximo status */}
            {proximosStatus.length > 0 && (
              <>
                <Separador />
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Observação (opcional)
                  </label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObs(e.target.value)}
                    rows={2}
                    placeholder="Ex: Pedido separado, saindo para entrega..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Botões de avançar status */}
                <div className="flex flex-col gap-2">
                  {proximosStatus.map((s) => (
                    <Botao
                      key={s.valor}
                      onClick={() => atualizarStatus(s.valor)}
                      disabled={isPending}
                      tamanho="p"
                      className="w-full"
                    >
                      {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      {s.rotulo}
                    </Botao>
                  ))}
                </div>
              </>
            )}

            {/* Cancelar pedido */}
            {!['entregue', 'cancelado'].includes(pedido.status) && (
              <>
                <Separador />
                <Botao
                  variante="perigo"
                  tamanho="p"
                  className="w-full"
                  onClick={cancelarPedido}
                  disabled={isPending}
                >
                  Cancelar Pedido
                </Botao>
              </>
            )}
          </CartaoConteudo>
        </Cartao>

        {/* Dados do cliente + endereço */}
        <Cartao>
          <CartaoCabecalho>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CartaoTitulo className="text-base">Entrega</CartaoTitulo>
            </div>
          </CartaoCabecalho>
          <CartaoConteudo className="space-y-1 text-sm">
            <p className="font-medium">{pedido.nomeCliente ?? 'Cliente'}</p>
            <Separador className="my-2" />
            <p>{pedido.endereco.logradouro}, {pedido.endereco.numero}</p>
            {pedido.endereco.complemento && (
              <p className="text-muted-foreground">{pedido.endereco.complemento}</p>
            )}
            <p>{pedido.endereco.bairro}</p>
            <p>{pedido.endereco.cidade} — {pedido.endereco.estado}</p>
            <p className="text-muted-foreground">CEP {pedido.endereco.cep}</p>
          </CartaoConteudo>
        </Cartao>

        {/* Info de pagamento */}
        {pedido.pagamento && (
          <Cartao>
            <CartaoCabecalho>
              <CartaoTitulo className="text-base">Pagamento</CartaoTitulo>
            </CartaoCabecalho>
            <CartaoConteudo className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium uppercase">{pedido.pagamento.metodo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={
                  pedido.pagamento.status === 'aprovado'
                    ? 'font-medium text-emerald-600'
                    : pedido.pagamento.status === 'cancelado'
                      ? 'font-medium text-red-600'
                      : 'font-medium text-amber-600'
                }>
                  {pedido.pagamento.status}
                </span>
              </div>
              {pedido.pagamento.mpPaymentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID MP</span>
                  <span className="font-mono text-xs">{pedido.pagamento.mpPaymentId}</span>
                </div>
              )}
            </CartaoConteudo>
          </Cartao>
        )}
      </div>
    </div>
  )
}
