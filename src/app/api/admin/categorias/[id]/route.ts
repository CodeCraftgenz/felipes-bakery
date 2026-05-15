/**
 * API Admin — Edição e Desativação de Categoria
 * PATCH /api/admin/categorias/[id]
 * DELETE /api/admin/categorias/[id]
 */

import { NextRequest, NextResponse }          from 'next/server'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import { z }                                  from 'zod'
import { editarCategoria, desativarCategoria } from '@backend/modulos/categorias/mutations'

const schemaEdicao = z.object({
  nome:          z.string().min(2).optional(),
  descricao:     z.string().optional().nullable(),
  ordemExibicao: z.number().int().optional(),
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
  const parse = schemaEdicao.safeParse(body)
  if (!parse.success) return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })

  await editarCategoria(id, parse.data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })

  await desativarCategoria(id)
  return NextResponse.json({ ok: true })
}
