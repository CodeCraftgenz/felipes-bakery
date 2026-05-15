/**
 * API: Validar Cupom — Felipe's Bakery
 * POST /api/cupons/validar
 *
 * Valida um código de cupom e retorna o desconto calculado.
 * Chamado pelo componente ResumoCarrinho ao clicar em "Aplicar".
 *
 * Body: { codigo: string, subtotal: number }
 * Response 200: { codigo, tipo, valorDesconto, porcentagem? }
 * Response 400: { mensagem: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { validarCupom }              from '@backend/modulos/cupons/queries'
import { schemaValidarCupom }        from '@compartilhado/validacoes/pedido'
import { checarLimiteCupons }        from '@backend/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const { bloqueado } = await checarLimiteCupons(req)
    if (bloqueado) {
      return NextResponse.json(
        { mensagem: 'Muitas tentativas. Aguarde um momento.' },
        { status: 429 },
      )
    }
    // Lê e valida o body
    const body    = await req.json()
    const parsed  = schemaValidarCupom.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { mensagem: 'Dados inválidos: ' + parsed.error.errors[0]?.message },
        { status: 400 },
      )
    }

    const { codigo, subtotal } = parsed.data

    // Obtém o ID do cliente logado (opcional)
    const sessao    = await auth()
    const clienteId = sessao?.user?.role === 'customer'
      ? parseInt(sessao.user.id ?? '0') || undefined
      : undefined

    // Valida o cupom no banco
    const resultado = await validarCupom(codigo, subtotal, clienteId)

    if (!resultado.valido) {
      return NextResponse.json(
        { mensagem: resultado.motivo },
        { status: 400 },
      )
    }

    const { cupom } = resultado

    return NextResponse.json({
      codigo:        cupom.codigo,
      tipo:          cupom.tipo,
      valorDesconto: cupom.valorDesconto,
      // Valor base do cupom (% ou R$ conforme o tipo)
      valor:         cupom.valor,
    })
  } catch (erro) {
    console.error('[API /cupons/validar] Erro:', erro)
    return NextResponse.json(
      { mensagem: 'Erro interno ao validar cupom' },
      { status: 500 },
    )
  }
}
