/**
 * API Admin â€” CriaÃ§Ã£o de Produto
 * POST /api/admin/produtos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { z }                         from 'zod'
import { criarProduto }              from '@backend/modulos/produtos/mutations'

const schema = z.object({
  nome:          z.string().min(2),
  categoriaId:   z.number().int().positive(),
  preco:         z.string(),
  precoCompare:  z.string().optional().nullable(),
  pesoGramas:    z.number().optional().nullable(),
  descricao:     z.string().optional().nullable(),
  ingredientes:  z.string().optional().nullable(),
  emDestaque:    z.union([z.literal(0), z.literal(1)]),
  status:        z.enum(['published', 'draft', 'archived']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'NÃ£o autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: 'Dados invÃ¡lidos', detalhes: parse.error.flatten() }, { status: 400 })
  }

  const resultado = await criarProduto(parse.data)
  return NextResponse.json(resultado, { status: 201 })
}
