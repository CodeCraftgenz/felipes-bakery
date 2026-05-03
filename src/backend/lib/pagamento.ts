/**
 * Cliente Mercado Pago — Felipe's Bakery
 *
 * Inicializa o SDK do Mercado Pago com o Access Token de produção.
 * Expõe as classes necessárias para criar pagamentos Pix e cartão.
 *
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs
 *
 * Fluxo de pagamento:
 *   1. Cliente finaliza o carrinho → cria o pedido (status: aguardando_pagamento)
 *   2. API gera um pagamento Pix via createPixPayment()
 *   3. Frontend exibe o QR code para o cliente
 *   4. Cliente paga → MP dispara webhook → confirmamos o pedido
 */

import 'server-only'
import MercadoPagoConfig, { Payment } from 'mercadopago'
import type { PaymentCreateRequest } from 'mercadopago/dist/clients/payment/create/types'

// ── Singleton do cliente MP ───────────────────────────────────
// Reutiliza a mesma instância em toda a aplicação (hot reload safe)
declare global {
  // eslint-disable-next-line no-var
  var __mpClient: MercadoPagoConfig | undefined
}

// Lazy: só inicializa quando realmente usado (evita erro no build sem envs)
function obterClienteMP(): MercadoPagoConfig {
  if (globalThis.__mpClient) return globalThis.__mpClient

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error(
      '[Pagamento] MERCADOPAGO_ACCESS_TOKEN não está definido.\n' +
      'Configure a variável no arquivo .env.local',
    )
  }

  const client = new MercadoPagoConfig({ accessToken })
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__mpClient = client
  }
  return client
}

// ── Tipos de domínio ──────────────────────────────────────────

/** Dados necessários para criar um pagamento Pix */
export interface DadosPagamentoPix {
  /** ID do pedido no banco (usado como referência externa) */
  pedidoId:      number
  /** Número legível do pedido (ex: FBK-20260412-0042) */
  numeroPedido:  string
  /** Valor total em reais */
  valor:         number
  /** E-mail do pagador */
  emailPagador:  string
  /** Nome completo do pagador */
  nomePagador:   string
  /** CPF do pagador (somente números, 11 dígitos) */
  cpfPagador:    string
}

/** Resultado da criação do pagamento Pix */
export interface ResultadoPix {
  /** ID do pagamento no Mercado Pago */
  pagamentoMpId: string
  /** QR code em base64 para exibir como imagem */
  qrCodeBase64:  string
  /** Código copia-e-cola do Pix */
  qrCodeTexto:   string
  /** Data de expiração do QR code */
  expiracaoEm:   Date
  /** Status inicial (normalmente 'pending') */
  status:        string
}

// ── Função principal: criar pagamento Pix ─────────────────────

/**
 * Cria um pagamento Pix no Mercado Pago.
 * Retorna os dados do QR code para exibição ao cliente.
 *
 * @throws Error se a criação falhar ou o MP retornar erro
 */
export async function criarPagamentoPix(
  dados: DadosPagamentoPix,
): Promise<ResultadoPix> {
  const payment = new Payment(obterClienteMP())

  // Expiração: 30 minutos a partir de agora
  const expiracao = new Date(Date.now() + 30 * 60 * 1000)

  const requisicao: PaymentCreateRequest = {
    transaction_amount: dados.valor,
    description:        `Pedido ${dados.numeroPedido} — Felipe's Bakery`,
    payment_method_id:  'pix',
    // Referência externa: permite identificar o pedido no webhook
    external_reference: String(dados.pedidoId),
    date_of_expiration: expiracao.toISOString(),
    payer: {
      email:           dados.emailPagador,
      first_name:      dados.nomePagador.split(' ')[0],
      last_name:       dados.nomePagador.split(' ').slice(1).join(' ') || '-',
      identification: {
        type:   'CPF',
        number: dados.cpfPagador,
      },
    },
    // Metadados para rastreamento
    metadata: {
      pedido_id:     dados.pedidoId,
      numero_pedido: dados.numeroPedido,
    },
  }

  const resultado = await payment.create({
    body:                  requisicao,
    // Chave de idempotência: evita duplicatas em caso de retry
    requestOptions: {
      idempotencyKey: `pix-${dados.pedidoId}-${Date.now()}`,
    },
  })

  // Valida se os dados do QR code foram retornados
  const qrCode = resultado.point_of_interaction?.transaction_data
  if (!qrCode?.qr_code || !qrCode?.qr_code_base64) {
    throw new Error(
      `[Pagamento] Mercado Pago não retornou os dados do QR code. ` +
      `Status: ${resultado.status}, ID: ${resultado.id}`,
    )
  }

  return {
    pagamentoMpId: String(resultado.id),
    qrCodeBase64:  qrCode.qr_code_base64,
    qrCodeTexto:   qrCode.qr_code,
    expiracaoEm:   expiracao,
    status:        resultado.status ?? 'pending',
  }
}

/**
 * Consulta o status de um pagamento no Mercado Pago.
 * Usado pelo polling do frontend enquanto aguarda confirmação.
 *
 * @param pagamentoMpId - ID do pagamento no MP
 */
export async function consultarPagamento(pagamentoMpId: string) {
  const payment = new Payment(obterClienteMP())
  const resultado = await payment.get({ id: pagamentoMpId })
  return {
    id:     String(resultado.id),
    status: resultado.status,
    // approved = pago, pending = aguardando, rejected = recusado
  }
}
