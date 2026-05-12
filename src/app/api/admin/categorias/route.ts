/**
 * API Admin "” Criação de Categoria
 * POST /api/admin/categorias
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { z }                         from 'zod'
import { criarCategoria }            from '@backend/modulos/categorias/mutations'

const schema = z.object({
  nome:          z.string().min(2),
  descricao:     z.string().optional().nullable(),
  ordemExibicao: z.number().int().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body  = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
  }

  const resultado = await criarCategoria(parse.data)
  return NextResponse.json(resultado, { status: 201 })
}
