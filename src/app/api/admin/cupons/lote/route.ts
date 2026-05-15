/**
 * API Admin — Cupons em lote
 * POST /api/admin/cupons/lote → gera N cupons únicos para campanha
 *
 * Útil para o admin distribuir N códigos (ex: 50 cupons NATAL para
 * usar em ações de marketing, prêmios, etc).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import { gerarCuponsLote }           from '@backend/modulos/cupons/mutations'

// Limites: 1 a 500 por chamada para evitar uso abusivo
const schemaLote = z.object({
  prefixo:           z.string().min(2).max(20),
  quantidade:        z.number().int().min(1).max(500),
  tipo:              z.enum(['percentual', 'fixo']),
  valor:             z.string().min(1),
  descricao:         z.string().max(255).optional().nullable(),
  valorMinimoPedido: z.string().optional().nullable(),
  maxDesconto:       z.string().optional().nullable(),
  maxUsosPorCliente: z.number().int().positive().optional(),
  validoAte:         z.string().datetime().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body  = await req.json().catch(() => null)
  const parse = schemaLote.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const { validoAte, ...resto } = parse.data
    const codigos = await gerarCuponsLote({
      ...resto,
      validoAte: validoAte ? new Date(validoAte) : null,
    })
    return NextResponse.json({ codigos, total: codigos.length }, { status: 201 })
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro ao gerar lote'
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
