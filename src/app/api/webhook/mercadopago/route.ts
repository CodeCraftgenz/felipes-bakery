/**
 * Webhook do Mercado Pago — Felipe's Bakery
 * POST /api/webhook/mercadopago
 *
 * Recebe notificações de pagamento do Mercado Pago e atualiza o status
 * do pedido no banco de dados.
 *
 * Segurança:
 *   - Verifica a assinatura x-signature do MP (HMAC-SHA256)
 *   - Apenas aceita eventos do tipo "payment"
 *   - Idempotente: processa cada pagamento apenas uma vez
 *
 * Mapeamento de status (MP → schema interno):
 *   MP approved  → pedido: paid
 *   MP rejected  → pedido: payment_failed
 *   MP cancelled → pedido: cancelled
 *   MP refunded  → pedido: cancelled (estorno encerra o pedido)
 *
 * Configuração no painel MP:
 *   URL: https://felipesbakery.com.br/api/webhook/mercadopago
 *   Eventos: Pagamentos (payment)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto                        from 'crypto'
import { consultarPagamento }        from '@backend/lib/pagamento'
import {
  atualizarStatusPedido,
  atualizarStatusPagamento,
} from '@backend/modulos/pedidos/mutations'
import { db, pedidos }               from '@backend/lib/banco'
import type { StatusPedido }         from '@schema'
import { eq }                        from 'drizzle-orm'

// ── Mapeamento de status do MP para status interno ────────────
// Cada chave do MP é mapeada para o par (statusPedido, statusPagamento).
type MapeamentoStatus = {
  pedido:    StatusPedido
  pagamento: 'pending' | 'paid' | 'failed' | 'refunded' | 'in_process' | 'cancelled'
}

const MAPA_STATUS: Record<string, MapeamentoStatus> = {
  approved:     { pedido: 'paid',            pagamento: 'paid'     },
  pending:      { pedido: 'pending_payment', pagamento: 'pending'  },
  in_process:   { pedido: 'pending_payment', pagamento: 'in_process' },
  rejected:     { pedido: 'payment_failed',  pagamento: 'failed'   },
  cancelled:    { pedido: 'cancelled',       pagamento: 'cancelled' },
  refunded:     { pedido: 'cancelled',       pagamento: 'refunded' },
  charged_back: { pedido: 'cancelled',       pagamento: 'refunded' },
}

// ── Handler Principal ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body     = await req.text()
    const payload  = JSON.parse(body)

    // Verifica a assinatura (segurança obrigatória em produção)
    const assinaturaValida = verificarAssinatura(req, body)
    if (!assinaturaValida) {
      console.warn('[Webhook MP] Assinatura inválida — requisição rejeitada')
      // 400 não causa retentativas do MP (só 5xx causa)
      return NextResponse.json({ erro: 'Assinatura inválida' }, { status: 400 })
    }

    // Processa apenas eventos de pagamento
    if (payload.type !== 'payment') {
      return NextResponse.json({ recebido: true })
    }

    const mpPaymentId = String(payload.data?.id)
    if (!mpPaymentId) {
      return NextResponse.json({ recebido: true })
    }

    // Consulta o status atual no MP (não confia apenas no payload do webhook)
    const pagamentoMP = await consultarPagamento(mpPaymentId)
    const mapeamento  = MAPA_STATUS[pagamentoMP.status ?? '']

    if (!mapeamento) {
      // Status desconhecido — ignora silenciosamente
      return NextResponse.json({ recebido: true })
    }

    // Atualiza o status do pagamento no banco (tabela payments)
    await atualizarStatusPagamento(mpPaymentId, mapeamento.pagamento, payload)

    // Busca o pedido pela referência externa do MP
    // (external_reference = pedidoId que definimos na criação)
    const externalRef = (pagamentoMP as any).external_reference ?? pagamentoMP.id
    const pedidoIdRef = parseInt(String(externalRef))

    if (Number.isNaN(pedidoIdRef)) {
      console.error(`[Webhook MP] external_reference inválido para pagamento ${mpPaymentId}`)
      return NextResponse.json({ recebido: true })
    }

    const [pedidoBanco] = await db
      .select({ id: pedidos.id, numeroPedido: pedidos.numeroPedido, status: pedidos.status })
      .from(pedidos)
      .where(eq(pedidos.id, pedidoIdRef))
      .limit(1)

    if (!pedidoBanco) {
      console.error(`[Webhook MP] Pedido não encontrado para pagamento ${mpPaymentId}`)
      return NextResponse.json({ recebido: true })
    }

    // Evita reprocessar se o pedido já está em um status final/idempotente
    const statusFinais: StatusPedido[] = ['paid', 'cancelled', 'delivered', 'payment_failed']
    if (statusFinais.includes(pedidoBanco.status as StatusPedido)) {
      return NextResponse.json({ recebido: true })
    }

    // Atualiza o status do pedido
    const observacao = pagamentoMP.status === 'approved'
      ? `Pagamento Pix confirmado. ID MP: ${mpPaymentId}`
      : `Status do pagamento atualizado para "${pagamentoMP.status}". ID MP: ${mpPaymentId}`

    await atualizarStatusPedido(pedidoBanco.id, mapeamento.pedido, observacao)

    console.log(
      `[Webhook MP] Pedido ${pedidoBanco.numeroPedido}: ${pedidoBanco.status} → ${mapeamento.pedido}`,
    )

    return NextResponse.json({ recebido: true })
  } catch (erro) {
    console.error('[Webhook MP] Erro ao processar webhook:', erro)
    // Retorna 200 para o MP não ficar reenviando
    return NextResponse.json({ recebido: true })
  }
}

// ── Verificação de Assinatura HMAC-SHA256 ─────────────────────
/**
 * Verifica se o webhook realmente veio do Mercado Pago.
 * Usa a chave secreta configurada no painel MP.
 *
 * Formato do cabeçalho x-signature: "ts=<timestamp>,v1=<hash>"
 */
function verificarAssinatura(req: NextRequest, body: string): boolean {
  const secret    = process.env.MP_WEBHOOK_SECRET
  const assinatura = req.headers.get('x-signature')
  const requestId  = req.headers.get('x-request-id')

  // Em desenvolvimento sem secret configurado, aceita tudo
  if (!secret) {
    if (process.env.NODE_ENV === 'development') return true
    return false
  }

  if (!assinatura) return false

  try {
    // Extrai timestamp e hash do cabeçalho
    const partes = Object.fromEntries(
      assinatura.split(',').map((p) => p.split('=')),
    )
    const ts   = partes['ts']
    const hash = partes['v1']

    if (!ts || !hash) return false

    // Monta a string de verificação conforme documentação do MP
    const manifest = `id:${JSON.parse(body).data?.id};request-id:${requestId};ts:${ts};`
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))
  } catch {
    return false
  }
}
