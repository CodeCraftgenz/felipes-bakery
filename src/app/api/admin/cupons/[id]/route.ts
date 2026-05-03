/**
 * API Admin — Cupom específico
 * PATCH  /api/admin/cupons/[id] → atualiza ou alterna ativo
 * DELETE /api/admin/cupons/[id] → remove cupom
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { z }                         from 'zod'
import {
  atualizarCupom,
  alternarAtivoCupom,
  deletarCupom,
} from '@backend/modulos/cupons/mutations'

// Edição: todos os campos são opcionais
const schemaEdicao = z.object({
  codigo:             z.string().min(2).max(50).optional(),
  descricao:          z.string().max(255).optional().nullable(),
  tipo:               z.enum(['percentual', 'fixo']).optional(),
  valor:              z.string().min(1).optional(),
  valorMinimoPedido:  z.string().optional().nullable(),
  maxDesconto:        z.string().optional().nullable(),
  maxUsos:            z.number().int().positive().optional().nullable(),
  maxUsosPorCliente:  z.number().int().positive().optional(),
  aplicaA:            z.enum(['todos', 'categoria', 'produto']).optional(),
  aplicaAId:          z.number().int().positive().optional().nullable(),
  ativo:              z.union([z.literal(0), z.literal(1)]).optional(),
  validoDesde:        z.string().datetime().optional().nullable(),
  validoAte:          z.string().datetime().optional().nullable(),
  /** Atalho — se true, ignora os demais campos e apenas alterna ativo */
  alternarAtivo:      z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })

  const body  = await req.json().catch(() => null)
  const parse = schemaEdicao.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  // Atalho para alternar ativo sem precisar enviar todos os campos
  if (parse.data.alternarAtivo) {
    await alternarAtivoCupom(id)
    return NextResponse.json({ ok: true })
  }

  const { alternarAtivo, validoDesde, validoAte, ...resto } = parse.data
  await atualizarCupom(id, {
    ...resto,
    validoDesde: validoDesde !== undefined ? (validoDesde ? new Date(validoDesde) : null) : undefined,
    validoAte:   validoAte   !== undefined ? (validoAte   ? new Date(validoAte)   : null) : undefined,
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })

  await deletarCupom(id)
  return NextResponse.json({ ok: true })
}
