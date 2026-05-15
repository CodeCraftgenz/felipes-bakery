/**
 * API Admin — Atualizar Status do Pedido
 * PATCH /api/admin/pedidos/[id]/status
 */

import { NextRequest, NextResponse }  from 'next/server'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import { z }                          from 'zod'
import { atualizarStatusPedido }      from '@backend/modulos/pedidos/mutations'

// Status válidos — espelham o enum do schema (banco/schema/pedidos.ts)
const STATUS_VALIDOS = [
  'pending_payment',
  'payment_failed',
  'paid',
  'in_production',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

const schema = z.object({
  status:     z.enum(STATUS_VALIDOS),
  observacao: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })

  const body  = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
  }

  await atualizarStatusPedido(id, parse.data.status, parse.data.observacao)
  return NextResponse.json({ ok: true })
}
