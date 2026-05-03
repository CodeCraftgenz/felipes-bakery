/**
 * API: Status do Pedido — Felipe's Bakery
 * GET /api/pedidos/[numero]/status
 *
 * Retorna o status atual de um pedido.
 * Usado pelo polling do frontend na página de confirmação
 * enquanto aguarda o pagamento Pix ser confirmado.
 *
 * Response 200: { status, numeroPedido }
 * Response 404: { mensagem }
 */

import { NextRequest, NextResponse } from 'next/server'
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

    return NextResponse.json({
      numeroPedido: pedido.numeroPedido,
      status:       pedido.status,
      // Retorna dados do Pix se ainda pendente (para reexibir QR code)
      pixQrCode:       pedido.pagamento?.pixQrCode    ?? null,
      pixCopiaCola:    pedido.pagamento?.pixCopiaCola ?? null,
      pixExpiracao:    pedido.pagamento?.pixExpiracao ?? null,
    })
  } catch (erro) {
    console.error('[API /pedidos/status] Erro:', erro)
    return NextResponse.json(
      { mensagem: 'Erro ao consultar status' },
      { status: 500 },
    )
  }
}
