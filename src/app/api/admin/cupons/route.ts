/**
 * API Admin — Cupons
 * GET  /api/admin/cupons → lista todos os cupons
 * POST /api/admin/cupons → cria um novo cupom
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import { z }                         from 'zod'
import { listarCupons }              from '@backend/modulos/cupons/queries'
import { criarCupom }                from '@backend/modulos/cupons/mutations'

// ── Schema de validação ────────────────────────────────────────
const schemaCriacao = z.object({
  codigo:             z.string().min(2).max(50),
  descricao:          z.string().max(255).optional().nullable(),
  tipo:               z.enum(['percentual', 'fixo']),
  valor:              z.string().min(1),
  valorMinimoPedido:  z.string().optional().nullable(),
  maxDesconto:        z.string().optional().nullable(),
  maxUsos:            z.number().int().positive().optional().nullable(),
  maxUsosPorCliente:  z.number().int().positive().optional(),
  aplicaA:            z.enum(['todos', 'categoria', 'produto']).optional(),
  aplicaAId:          z.number().int().positive().optional().nullable(),
  ativo:              z.union([z.literal(0), z.literal(1)]).optional(),
  validoDesde:        z.string().datetime().optional().nullable(),
  validoAte:          z.string().datetime().optional().nullable(),
})

// ── GET — Lista todos os cupons ────────────────────────────────
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const cupons = await listarCupons()
  return NextResponse.json({ cupons })
}

// ── POST — Cria novo cupom ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body  = await req.json().catch(() => null)
  const parse = schemaCriacao.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  const { validoDesde, validoAte, ...resto } = parse.data
  const resultado = await criarCupom({
    ...resto,
    validoDesde: validoDesde ? new Date(validoDesde) : null,
    validoAte:   validoAte   ? new Date(validoAte)   : null,
  })
  return NextResponse.json(resultado, { status: 201 })
}
