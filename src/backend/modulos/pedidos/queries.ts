/**
 * Queries de Pedidos — Felipe's Bakery
 *
 * Funções de leitura do banco para o módulo de pedidos.
 * Server-only.
 */

import 'server-only'
import { eq, desc } from 'drizzle-orm'
import { db }       from '@backend/lib/banco'
import {
  pedidos,
  itensPedido,
  produtos,
  pagamentos,
  historicoStatusPedido,
} from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export type PedidoDetalhado = {
  id:            number
  numeroPedido:  string
  status:        string
  total:         string
  criadoEm:      Date
  nomeCliente:   string | null
  endereco: {
    logradouro: string | null
    numero:     string | null
    complemento?: string | null
    bairro:     string | null
    cidade:     string | null
    estado:     string | null
    cep:        string | null
  }
  itens: Array<{
    produtoId:    number | null
    nomeProduto:  string
    quantidade:   number
    precoUnitario: string
    subtotal:     string
  }>
  pagamento: {
    metodo:        string
    status:        string
    pixQrCode?:    string | null
    pixCopiaCola?: string | null
    pixExpiracao?: Date | null
    mpPaymentId?:  string | null
  } | null
  historico: Array<{
    status:    string
    nota:      string | null
    criadoEm:  Date
  }>
}

// ── Funções ───────────────────────────────────────────────────

/**
 * Busca um pedido pelo número legível (ex: FBK-20260412-0042).
 * Retorna todos os detalhes: itens, pagamento, histórico.
 * Retorna null se não encontrado.
 */
export async function buscarPedidoPorNumero(
  numeroPedido: string,
): Promise<PedidoDetalhado | null> {
  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.numeroPedido, numeroPedido))
    .limit(1)

  if (!pedido) return null

  // Busca itens com nome do produto (snapshot vem do próprio item)
  const itens = await db
    .select({
      produtoId:     itensPedido.produtoId,
      nomeProduto:   itensPedido.nomeProduto,
      quantidade:    itensPedido.quantidade,
      precoUnitario: itensPedido.precoProduto,
      subtotal:      itensPedido.subtotal,
      // join opcional para fallback caso o snapshot esteja vazio
      nomeAtual:     produtos.nome,
    })
    .from(itensPedido)
    .leftJoin(produtos, eq(itensPedido.produtoId, produtos.id))
    .where(eq(itensPedido.pedidoId, pedido.id))

  // Busca dados do pagamento
  const [pagamento] = await db
    .select()
    .from(pagamentos)
    .where(eq(pagamentos.pedidoId, pedido.id))
    .limit(1)

  // Busca histórico de status
  const historico = await db
    .select({
      status:   historicoStatusPedido.status,
      nota:     historicoStatusPedido.nota,
      criadoEm: historicoStatusPedido.criadoEm,
    })
    .from(historicoStatusPedido)
    .where(eq(historicoStatusPedido.pedidoId, pedido.id))
    .orderBy(desc(historicoStatusPedido.criadoEm))

  return {
    id:           pedido.id,
    numeroPedido: pedido.numeroPedido,
    status:       pedido.status,
    total:        pedido.total,
    criadoEm:     pedido.criadoEm,
    nomeCliente:  pedido.entregaNome,
    endereco: {
      logradouro:  pedido.entregaLogradouro,
      numero:      pedido.entregaNumero,
      complemento: pedido.entregaComplemento,
      bairro:      pedido.entregaBairro,
      cidade:      pedido.entregaCidade,
      estado:      pedido.entregaEstado,
      cep:         pedido.entregaCep,
    },
    itens: itens.map((i) => ({
      produtoId:     i.produtoId,
      nomeProduto:   i.nomeProduto ?? i.nomeAtual ?? 'Produto',
      quantidade:    i.quantidade,
      precoUnitario: i.precoUnitario,
      subtotal:      i.subtotal,
    })),
    pagamento: pagamento
      ? {
          metodo:       pagamento.metodo,
          status:       pagamento.status,
          pixQrCode:    pagamento.pixQrCode,
          pixCopiaCola: pagamento.pixCopiaCola,
          pixExpiracao: pagamento.pixExpiracao,
          mpPaymentId:  pagamento.idProvedorPagamento,
        }
      : null,
    historico,
  }
}

/**
 * Busca pedidos de um cliente pelo ID.
 * Usado na área "Meus Pedidos".
 */
export async function buscarPedidosDoCliente(clienteId: number) {
  return db
    .select({
      id:           pedidos.id,
      numeroPedido: pedidos.numeroPedido,
      status:       pedidos.status,
      total:        pedidos.total,
      criadoEm:     pedidos.criadoEm,
    })
    .from(pedidos)
    .where(eq(pedidos.clienteId, clienteId))
    .orderBy(desc(pedidos.criadoEm))
    .limit(50)
}
