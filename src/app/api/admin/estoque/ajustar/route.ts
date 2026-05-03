/**
 * API Admin â€” Ajuste de Estoque
 * POST /api/admin/estoque/ajustar
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { z }                         from 'zod'
import { ajustarEstoque }            from '@backend/modulos/estoque/mutations'

const schema = z.object({
  produtoId:  z.number().int().positive(),
  tipo:       z.enum(['entrada', 'saida', 'ajuste']),
  quantidade: z.number().int().positive(),
  motivo:     z.string().min(3),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'NÃ£o autorizado' }, { status: 401 })

  const body  = await req.json().catch(() => null)
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: 'Dados invÃ¡lidos', detalhes: parse.error.flatten() }, { status: 400 })
  }

  const { produtoId, tipo, quantidade, motivo } = parse.data
  const usuarioId = (session.user as any).id ? Number((session.user as any).id) : undefined

  await ajustarEstoque(produtoId, tipo, quantidade, motivo, usuarioId)
  return NextResponse.json({ ok: true })
}
