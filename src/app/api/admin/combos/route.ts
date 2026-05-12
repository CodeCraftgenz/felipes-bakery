/**
 * API Admin — Combos
 * GET  /api/admin/combos → lista todos os combos
 * POST /api/admin/combos → cria um novo combo (com itens)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { auth }                      from '@backend/lib/auth'
import { listarCombosAdmin }         from '@backend/modulos/combos/queries'
import { criarCombo }                from '@backend/modulos/combos/mutations'

const schemaItem = z.object({
  produtoId:  z.number().int().positive(),
  quantidade: z.number().int().positive(),
  ordem:      z.number().int().nonnegative().optional(),
})

const schemaCriacao = z.object({
  slug:          z.string().min(2).max(255),
  nome:          z.string().min(2).max(255),
  descricao:     z.string().max(2000).nullable().optional(),
  preco:         z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato inválido'),
  precoOriginal: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  urlImagem:     z.string().url('URL inválida').nullable().optional().or(z.literal('')),
  tema:          z.string().max(30).optional(),
  destacarHome:  z.union([z.literal(0), z.literal(1)]).optional(),
  ativo:         z.union([z.literal(0), z.literal(1)]).optional(),
  validoDesde:   z.string().datetime().nullable().optional(),
  validoAte:     z.string().datetime().nullable().optional(),
  itens:         z.array(schemaItem).min(1, 'Adicione ao menos 1 produto'),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const combos = await listarCombosAdmin()
  return NextResponse.json({ combos })
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

  try {
    const { validoDesde, validoAte, urlImagem, ...resto } = parse.data
    const id = await criarCombo({
      ...resto,
      urlImagem:   urlImagem === '' ? null : urlImagem ?? null,
      validoDesde: validoDesde ? new Date(validoDesde) : null,
      validoAte:   validoAte   ? new Date(validoAte)   : null,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro ao criar combo'
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
