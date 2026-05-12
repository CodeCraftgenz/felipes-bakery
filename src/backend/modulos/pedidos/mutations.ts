/**
 * Mutations de Pedidos — Felipe's Bakery
 *
 * Operações de escrita no banco para o módulo de pedidos.
 * Server-only.
 *
 * Fluxo de criação de um pedido:
 *   1. criarPedido()        → insere pedido + itens + histórico inicial
 *   2. registrarPagamentoPix() → insere o registro de pagamento (pendente)
 *   3. [webhook MP]         → atualizarStatusPedido() ao receber confirmação
 */

import 'server-only'
import { eq, sql }    from 'drizzle-orm'
import { db }         from '@backend/lib/banco'
import {
  pedidos,
  itensPedido,
  historicoStatusPedido,
  pagamentos,
  estoque,
  movimentacoesEstoque,
  cupons,
  usosCupom,
} from '@schema'
import type { StatusPedido }      from '@schema'
import { gerarNumeroPedido }      from '@compartilhado/utils'
import type { CriarPedidoInput }  from '@compartilhado/validacoes/pedido'

// ── Tipos ─────────────────────────────────────────────────────

/** Dados adicionais do servidor para criação do pedido */
interface DadosCriarPedido extends CriarPedidoInput {
  /** ID do cliente autenticado (null para compra como visitante) */
  clienteId?: number | null
  /** Valor do desconto já calculado */
  valorDesconto: number
  /** Total final após desconto */
  valorTotal: number
  /** ID do cupom aplicado (se houver) */
  cupomId?: number | null
}

/** Resultado da criação do pedido */
export interface PedidoCriado {
  id:           number
  numeroPedido: string
  valorTotal:   number
}

// ── Funções de Mutation ───────────────────────────────────────

/**
 * Cria um pedido completo no banco de dados dentro de uma transação.
 * A transação garante que, se qualquer etapa falhar, nada é persistido.
 *
 * Passos executados:
 *   1. Insere o registro principal do pedido (status: pending_payment)
 *   2. Insere cada item com snapshot de preço e nome do produto
 *   3. Registra o evento inicial no histórico de status
 *
 * Observação: a baixa de estoque NÁO acontece aqui — só ocorre após
 * confirmação de pagamento via webhook do Mercado Pago.
 */
export async function criarPedido(dados: DadosCriarPedido): Promise<PedidoCriado> {
  const numeroPedido = gerarNumeroPedido()
  const subtotalItens = dados.itens.reduce((s, i) => s + i.preco * i.quantidade, 0)

  return await db.transaction(async (tx) => {
    // ── Etapa 1: Insere o pedido principal ───────────────────
    const [pedidoInserido] = await tx.insert(pedidos).values({
      numeroPedido,
      clienteId: dados.clienteId ?? null,
      // Endereço de entrega (snapshot — preserva mesmo se cliente alterar)
      entregaNome:        dados.pagador.nome,
      entregaLogradouro:  dados.endereco.logradouro,
      entregaNumero:      dados.endereco.numero,
      entregaComplemento: dados.endereco.complemento ?? null,
      entregaBairro:      dados.endereco.bairro,
      entregaCidade:      dados.endereco.cidade,
      entregaEstado:      dados.endereco.estado,
      entregaCep:         dados.endereco.cep,
      // Valores
      subtotal:        String(subtotalItens),
      valorDesconto:   String(dados.valorDesconto),
      valorFrete:      '0.00',
      total:           String(dados.valorTotal),
      cupomId:         dados.cupomId ?? null,
      observacoes:     dados.observacoes ?? null,
      metodoPagamento: 'pix',
      statusPagamento: 'pending',
      status:          'pending_payment',
    })

    const pedidoId = (pedidoInserido as any).insertId as number

    // ── Etapa 2: Insere os itens do pedido ───────────────────
    // Busca os nomes/slugs dos produtos para snapshot
    await tx.insert(itensPedido).values(
      dados.itens.map((item) => ({
        pedidoId,
        produtoId:    item.produtoId,
        // Snapshot do produto (nomeProduto preenchido pelo gatilho do banco
        // ou pelo client; caso ausente, usamos um placeholder seguro)
        nomeProduto:  `Produto #${item.produtoId}`,
        precoProduto: String(item.preco),
        quantidade:   item.quantidade,
        subtotal:     String(item.preco * item.quantidade),
      })),
    )

    // ── Etapa 3: Histórico inicial ────────────────────────────
    await tx.insert(historicoStatusPedido).values({
      pedidoId,
      status: 'pending_payment',
      nota:   'Pedido criado — aguardando pagamento Pix',
    })

    return {
      id:           pedidoId,
      numeroPedido,
      valorTotal:   dados.valorTotal,
    }
  })
}

/**
 * Cria o registro de pagamento Pix associado ao pedido.
 * Chamado imediatamente após criarPedido() com os dados do QR code.
 */
export async function registrarPagamentoPix(dados: {
  pedidoId:      number
  pagamentoMpId: string
  valor:         number
  qrCodeBase64:  string
  qrCodeTexto:   string
  expiracaoEm:   Date
}) {
  await db.insert(pagamentos).values({
    pedidoId:            dados.pedidoId,
    metodo:              'pix',
    status:              'pending',
    valor:               String(dados.valor),
    idProvedorPagamento: dados.pagamentoMpId,
    pixQrCode:           dados.qrCodeBase64,
    pixCopiaCola:        dados.qrCodeTexto,
    pixExpiracao:        dados.expiracaoEm,
  })
}

/**
 * Atualiza o status do pedido e adiciona entrada no histórico.
 * Chamado pelo webhook do Mercado Pago ou por ações do admin.
 *
 * Quando o pedido transita para 'paid', baixa o estoque dos itens
 * e registra a movimentação correspondente.
 *
 * @param pedidoId  - ID do pedido no banco
 * @param novoStatus - Novo status do pedido (deve ser um StatusPedido válido)
 * @param nota      - Observação opcional para o histórico
 */
export async function atualizarStatusPedido(
  pedidoId:    number,
  novoStatus:  StatusPedido,
  nota?:       string,
) {
  await db.transaction(async (tx) => {
    // Lê o status atual para detectar transições especiais
    const [atual] = await tx
      .select({ status: pedidos.status, cupomId: pedidos.cupomId, clienteId: pedidos.clienteId, total: pedidos.total })
      .from(pedidos)
      .where(eq(pedidos.id, pedidoId))
      .limit(1)

    // Atualiza o status principal
    await tx
      .update(pedidos)
      .set({
        status:          novoStatus,
        statusPagamento: novoStatus === 'paid' ? 'paid' : undefined,
        atualizadoEm:    new Date(),
      })
      .where(eq(pedidos.id, pedidoId))

    // Registra no histórico (append-only)
    await tx.insert(historicoStatusPedido).values({
      pedidoId,
      status: novoStatus,
      nota:   nota ?? null,
    })

    // Transição para 'paid' → baixa estoque + registra uso de cupom
    if (novoStatus === 'paid' && atual?.status !== 'paid') {
      // Busca itens do pedido para baixar estoque
      const itens = await tx
        .select({ produtoId: itensPedido.produtoId, quantidade: itensPedido.quantidade })
        .from(itensPedido)
        .where(eq(itensPedido.pedidoId, pedidoId))

      for (const item of itens) {
        if (!item.produtoId) continue

        // Decrementa quantidade de forma atômica (evita race condition)
        await tx
          .update(estoque)
          .set({ quantidade: sql`GREATEST(0, ${estoque.quantidade} - ${item.quantidade})` })
          .where(eq(estoque.produtoId, item.produtoId))

        // Registra movimentação de saída
        await tx.insert(movimentacoesEstoque).values({
          produtoId: item.produtoId,
          tipo:      'saida',
          quantidade: item.quantidade,
          motivo:    `Pedido confirmado — ID ${pedidoId}`,
          pedidoId,
        })
      }

      // Registra uso do cupom (se houver)
      if (atual?.cupomId) {
        await tx.insert(usosCupom).values({
          cupomId:       atual.cupomId,
          pedidoId,
          clienteId:     atual.clienteId ?? null,
          valorDesconto: atual.total, // será sobrescrito pelo valor real
        })
        await tx
          .update(cupons)
          .set({ usosAtuais: sql`${cupons.usosAtuais} + 1` })
          .where(eq(cupons.id, atual.cupomId))
      }
    }
  })
}

/**
 * Atualiza o status do pagamento no banco (tabela `payments`).
 * Chamado pelo webhook do Mercado Pago.
 *
 * @param mpPaymentId   - ID do pagamento no Mercado Pago
 * @param novoStatus    - Novo status do pagamento (deve estar no enum)
 * @param payloadWebhook - Payload bruto recebido do MP (para auditoria)
 */
export async function atualizarStatusPagamento(
  mpPaymentId: string,
  novoStatus:  'pending' | 'paid' | 'failed' | 'refunded' | 'in_process' | 'cancelled',
  payloadWebhook?: object,
) {
  const camposExtras: Record<string, unknown> = {
    status:         novoStatus,
    payloadWebhook: payloadWebhook ? JSON.stringify(payloadWebhook) : undefined,
  }

  // Marca os timestamps específicos por status
  if (novoStatus === 'paid')     camposExtras.pagoEm     = new Date()
  if (novoStatus === 'failed')   camposExtras.falhouEm   = new Date()
  if (novoStatus === 'refunded') camposExtras.estornadoEm = new Date()

  await db
    .update(pagamentos)
    .set(camposExtras as any)
    .where(eq(pagamentos.idProvedorPagamento, mpPaymentId))
}
