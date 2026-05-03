/**
 * Etapa de Pagamento Pix — Checkout
 *
 * Exibe o QR code Pix e o código copia-e-cola.
 * Faz polling a cada 5 segundos para detectar quando o pagamento for confirmado.
 * Ao confirmar, redireciona para a página de confirmação do pedido.
 *
 * Client Component.
 */

'use client'

import React              from 'react'
import Image              from 'next/image'
import { useRouter }      from 'next/navigation'
import { Copy, Check, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { toast }          from 'sonner'
import { Botao }          from '@frontend/compartilhado/ui/botao'
import { formatarMoeda }  from '@compartilhado/utils'

// ── Props ─────────────────────────────────────────────────────
interface PropsEtapaPix {
  numeroPedido:  string
  valorTotal:    number
  qrCodeBase64:  string
  qrCodeTexto:   string
  expiracaoEm:   string   // ISO string
}

// ── Componente ────────────────────────────────────────────────
export function EtapaPix({
  numeroPedido,
  valorTotal,
  qrCodeBase64,
  qrCodeTexto,
  expiracaoEm,
}: PropsEtapaPix) {
  const router = useRouter()
  const [copiado, setCopiado]           = React.useState(false)
  const [statusPagamento, setStatus]    = React.useState<'aguardando' | 'confirmado' | 'expirado'>('aguardando')
  const [tempoRestante, setTempoRestante] = React.useState<number>(0)

  // ── Countdown do timer ────────────────────────────────────
  React.useEffect(() => {
    const calcular = () => {
      const restante = Math.max(0, Math.floor((new Date(expiracaoEm).getTime() - Date.now()) / 1000))
      setTempoRestante(restante)
      if (restante === 0) setStatus('expirado')
    }
    calcular()
    const interval = setInterval(calcular, 1000)
    return () => clearInterval(interval)
  }, [expiracaoEm])

  // ── Polling: verifica o status do pagamento a cada 5s ──────
  React.useEffect(() => {
    if (statusPagamento !== 'aguardando') return

    const verificar = async () => {
      try {
        const resposta = await fetch(`/api/pedidos/${numeroPedido}/status`)
        const dados    = await resposta.json()

        if (dados.status === 'confirmado') {
          setStatus('confirmado')
          toast.success('Pagamento confirmado! Redirecionando...')
          // Aguarda 1.5s para mostrar o feedback antes de redirecionar
          setTimeout(() => {
            router.push(`/pedido-confirmado/${numeroPedido}`)
          }, 1500)
        }
      } catch {
        // Ignora erros de rede no polling
      }
    }

    const interval = setInterval(verificar, 5000)
    return () => clearInterval(interval)
  }, [numeroPedido, statusPagamento, router])

  // ── Copiar código Pix ─────────────────────────────────────
  const aoCopiar = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeTexto)
      setCopiado(true)
      toast.success('Código Pix copiado!')
      setTimeout(() => setCopiado(false), 3000)
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.')
    }
  }

  // ── Formata o tempo restante (mm:ss) ──────────────────────
  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
  }

  // ── Confirmado ────────────────────────────────────────────
  if (statusPagamento === 'confirmado') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
        <h2 className="font-playfair text-2xl font-bold text-stone-900">
          Pagamento Confirmado!
        </h2>
        <p className="mt-2 text-stone-500">Redirecionando para a confirmação do pedido...</p>
        <Loader2 className="mt-4 h-6 w-6 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h2 className="font-playfair text-2xl font-bold text-stone-900">
          Pague via Pix
        </h2>
        <p className="mt-1 text-stone-500">
          Escaneie o QR code ou copie o código para pagar
        </p>
      </div>

      {/* Valor */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-700 font-medium">Pedido {numeroPedido}</p>
          <p className="text-2xl font-bold text-stone-900 mt-0.5">
            {formatarMoeda(valorTotal)}
          </p>
        </div>
        {/* Timer */}
        <div className={`flex items-center gap-2 text-sm font-mono font-medium ${
          tempoRestante < 120 ? 'text-red-600' : 'text-stone-600'
        }`}>
          <Clock className="h-4 w-4" />
          {statusPagamento === 'expirado' ? (
            <span className="text-red-600">Expirado</span>
          ) : (
            formatarTempo(tempoRestante)
          )}
        </div>
      </div>

      {/* QR Code */}
      {statusPagamento !== 'expirado' && (
        <div className="flex justify-center">
          <div className="rounded-2xl border-2 border-stone-200 p-4 bg-white inline-block">
            <Image
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code Pix"
              width={220}
              height={220}
              className="rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Status expirado */}
      {statusPagamento === 'expirado' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-700 font-medium">QR code expirado</p>
          <p className="text-sm text-red-600 mt-1">
            Recarregue a página para gerar um novo código.
          </p>
        </div>
      )}

      {/* Código copia-e-cola */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-700">
          Ou copie o código Pix:
        </p>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-600 font-mono overflow-hidden">
            <span className="truncate block">{qrCodeTexto.slice(0, 60)}...</span>
          </div>
          <Botao
            variante="contorno"
            tamanho="m"
            onClick={aoCopiar}
            disabled={statusPagamento === 'expirado'}
            className="shrink-0"
          >
            {copiado ? (
              <><Check className="h-4 w-4 text-green-600" /> Copiado!</>
            ) : (
              <><Copy className="h-4 w-4" /> Copiar</>
            )}
          </Botao>
        </div>
      </div>

      {/* Instruções */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-2">
        <p className="text-sm font-semibold text-stone-700">Como pagar:</p>
        <ol className="space-y-1 text-sm text-stone-600 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Acesse a área Pix</li>
          <li>Escaneie o QR code ou cole o código copiado</li>
          <li>Confirme o pagamento de <strong>{formatarMoeda(valorTotal)}</strong></li>
        </ol>
      </div>

      {/* Indicador de aguardando */}
      <div className="flex items-center justify-center gap-2 text-stone-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Aguardando confirmação do pagamento...
      </div>

    </div>
  )
}
