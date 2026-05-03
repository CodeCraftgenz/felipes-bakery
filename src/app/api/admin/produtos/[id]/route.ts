/**
 * API Admin — Edição e Exclusão de Produto
 * PATCH /api/admin/produtos/[id]
 * DELETE /api/admin/produtos/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { z }                         from 'zod'
import { editarProduto, excluirProduto } from '@backend/modulos/produtos/mutations'

const schemaEdicao = z.object({
  nome:          z.string().min(2).optional(),
  categoriaId:   z.number().int().positive().optional(),
  preco:         z.string().optional(),
  precoCompare:  z.string().optional().nullable(),
  pesoGramas:    z.number().optional().nullable(),
  descricao:     z.string().optional().nullable(),
  ingredientes:  z.string().optional().nullable(),
  emDestaque:    z.union([z.literal(0), z.literal(1)]).optional(),
  status:        z.enum(['published', 'draft', 'archived']).optional(),
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
    return NextResponse.json({ erro: 'Dados inválidos', detalhes: parse.error.flatten() }, { status: 400 })
  }

  await editarProduto(id, parse.data)
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

  await excluirProduto(id)
  return NextResponse.json({ ok: true })
}
