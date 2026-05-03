/**
 * API Admin — Alternar Status de Produto
 * PATCH /api/admin/produtos/[id]/status
 */

import { NextRequest, NextResponse }    from 'next/server'
import { auth }                         from '@backend/lib/auth'
import { z }                            from 'zod'
import { alternarStatusProduto }        from '@backend/modulos/produtos/mutations'

const schema = z.object({
  status: z.enum(['published', 'draft', 'archived']),
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
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: 'Status inválido' }, { status: 400 })
  }

  await alternarStatusProduto(id, parse.data.status)
  return NextResponse.json({ ok: true })
}
