/**
 * API Admin — Banners
 * GET  /api/admin/banners → lista todos os banners
 * POST /api/admin/banners → cria um novo banner
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth }                      from '@backend/lib/auth'
import { z }                         from 'zod'
import { listarBanners }             from '@backend/modulos/banners/queries'
import { criarBanner }               from '@backend/modulos/banners/mutations'

const schemaCriacao = z.object({
  titulo:         z.string().min(2).max(255),
  urlImagem:      z.string().url().max(500),
  urlLink:        z.string().url().max(500).optional().nullable(),
  ordemExibicao:  z.number().int().min(0).optional(),
  ativo:          z.union([z.literal(0), z.literal(1)]).optional(),
  validoDesde:    z.string().datetime().optional().nullable(),
  validoAte:      z.string().datetime().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const banners = await listarBanners()
  return NextResponse.json({ banners })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body  = await req.json().catch(() => null)
  const parse = schemaCriacao.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  const { validoDesde, validoAte, ...resto } = parse.data
  const resultado = await criarBanner({
    ...resto,
    validoDesde: validoDesde ? new Date(validoDesde) : null,
    validoAte:   validoAte   ? new Date(validoAte)   : null,
  })
  return NextResponse.json(resultado, { status: 201 })
}
