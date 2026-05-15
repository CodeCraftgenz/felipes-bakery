/**
 * API Admin — Imagem específica de um produto
 * DELETE /api/admin/produtos/[id]/imagens/[imgId] → remove imagem
 * PATCH  /api/admin/produtos/[id]/imagens/[imgId] → marca como principal
 *                                                   body: { principal: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import {
  removerImagemProduto,
  definirImagemPrincipal,
} from '@backend/modulos/produtos/mutations'

const schemaPatch = z.object({
  principal: z.boolean().optional(),
})

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; imgId: string } },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const imgId = Number(params.imgId)
  if (!Number.isInteger(imgId) || imgId <= 0) {
    return NextResponse.json({ erro: 'ID de imagem inválido' }, { status: 400 })
  }

  await removerImagemProduto(imgId)
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; imgId: string } },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const produtoId = Number(params.id)
  const imgId     = Number(params.imgId)
  if (!Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(imgId) || imgId <= 0) {
    return NextResponse.json({ erro: 'IDs inválidos' }, { status: 400 })
  }

  const body  = await req.json().catch(() => null)
  const parse = schemaPatch.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
  }

  if (parse.data.principal) {
    await definirImagemPrincipal(produtoId, imgId)
  }

  return NextResponse.json({ ok: true })
}
