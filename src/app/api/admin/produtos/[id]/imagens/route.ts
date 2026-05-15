/**
 * API Admin — Imagens de um produto
 * GET  /api/admin/produtos/[id]/imagens → lista imagens do produto
 * POST /api/admin/produtos/[id]/imagens → adiciona imagem por URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import { listarImagensProduto }      from '@backend/modulos/produtos/queries'
import { adicionarImagemProduto }    from '@backend/modulos/produtos/mutations'

const schemaAdicionar = z.object({
  url:           z.string().url('URL inválida').max(500),
  ordemExibicao: z.number().int().nonnegative().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })
  }

  const imagens = await listarImagensProduto(id)
  return NextResponse.json({ imagens })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const produtoId = Number(params.id)
  if (!Number.isInteger(produtoId) || produtoId <= 0) {
    return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })
  }

  const body  = await req.json().catch(() => null)
  const parse = schemaAdicionar.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  await adicionarImagemProduto(
    produtoId,
    parse.data.url,
    parse.data.ordemExibicao ?? 0,
  )
  return NextResponse.json({ ok: true }, { status: 201 })
}
