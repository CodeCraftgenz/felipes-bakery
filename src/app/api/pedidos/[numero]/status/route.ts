/**
 * API: Status do Pedido — Felipe's Bakery
 * GET /api/pedidos/[numero]/status
 *
 * Retorna o status atual de um pedido.
 * Usado pelo polling do frontend na página de confirmação.
 *
 * Dados Pix (QR code) são retornados somente para:
 *   - Cliente dono do pedido (autenticado)
 *   - Admin autenticado
 *   - Pedido ainda em pending_payment com QR não expirado (guest checkout)
 *
 * Response 200: { status, numeroPedido, pixQrCode?, pixCopiaCola?, pixExpiracao? }
 * Response 404: { mensagem }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { buscarPedidoPorNumero }     from '@backend/modulos/pedidos/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ numero: string }> },
) {
  try {
    const { numero } = await params
    const pedido     = await buscarPedidoPorNumero(numero)

    if (!pedido) {
      return NextResponse.json(
        { mensagem: 'Pedido não encontrado' },
        { status: 404 },
      )
    }

    // Determina quem está consultando
    const sessao    = await auth()
    const ehAdmin   = (sessao?.user as any)?.adminUser === true
    const clienteId = sessao?.user?.role === 'customer'
      ? parseInt(sessao.user.id ?? '0') || null
      : null

    const ehDono = clienteId !== null &&
                   pedido.clienteId !== null &&
                   pedido.clienteId === clienteId

    // Dados Pix só visíveis para: dono, admin, ou guest com QR ainda válido
    // (janela de 30 min após o checkout — suficiente para exibir o QR ao comprador)
    const pixExpiracao = pedido.pagamento?.pixExpiracao
    const qrAindaValido = pixExpiracao
      ? new Date(pixExpiracao) > new Date()
      : false
    const mostrarPix = ehDono || ehAdmin ||
                       (pedido.status === 'pending_payment' && qrAindaValido)

    return NextResponse.json({
      numeroPedido: pedido.numeroPedido,
      status:       pedido.status,
      pixQrCode:    mostrarPix ? (pedido.pagamento?.pixQrCode    ?? null) : null,
      pixCopiaCola: mostrarPix ? (pedido.pagamento?.pixCopiaCola ?? null) : null,
      pixExpiracao: mostrarPix ? (pedido.pagamento?.pixExpiracao ?? null) : null,
    })
  } catch (erro) {
    console.error('[API /pedidos/status] Erro:', erro)
    return NextResponse.json(
      { mensagem: 'Erro ao consultar status' },
      { status: 500 },
    )
  }
}
