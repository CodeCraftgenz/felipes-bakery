/**
 * API Admin — Banner específico
 * PATCH  /api/admin/banners/[id] → atualiza ou alterna ativo
 * DELETE /api/admin/banners/[id] → remove banner
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@backend/lib/auth/require-admin'
import { z }                         from 'zod'
import {
  atualizarBanner,
  alternarAtivoBanner,
  deletarBanner,
} from '@backend/modulos/banners/mutations'

const schemaEdicao = z.object({
  titulo:         z.string().min(2).max(255).optional(),
  urlImagem:      z.string().url().max(500).optional(),
  urlLink:        z.string().url().max(500).optional().nullable(),
  ordemExibicao:  z.number().int().min(0).optional(),
  ativo:          z.union([z.literal(0), z.literal(1)]).optional(),
  validoDesde:    z.string().datetime().optional().nullable(),
  validoAte:      z.string().datetime().optional().nullable(),
  alternarAtivo:  z.boolean().optional(),
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
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  if (parse.data.alternarAtivo) {
    await alternarAtivoBanner(id)
    return NextResponse.json({ ok: true })
  }

  const { alternarAtivo, validoDesde, validoAte, ...resto } = parse.data
  await atualizarBanner(id, {
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
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })

  await deletarBanner(id)
  return NextResponse.json({ ok: true })
}
