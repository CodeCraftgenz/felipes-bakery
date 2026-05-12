/**
 * API Admin — Combos por ID
 * PATCH  /api/admin/combos/[id] → atualiza combo (com possível troca de itens)
 *                                  body { alternarAtivo: true } → toggle ativo
 * DELETE /api/admin/combos/[id] → remove combo
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { auth }                      from '@backend/lib/auth'
import {
  atualizarCombo,
  alternarAtivoCombo,
  deletarCombo,
} from '@backend/modulos/combos/mutations'

const schemaItem = z.object({
  produtoId:  z.number().int().positive(),
  quantidade: z.number().int().positive(),
  ordem:      z.number().int().nonnegative().optional(),
})

const schemaEdicao = z.object({
  slug:          z.string().min(2).max(255).optional(),
  nome:          z.string().min(2).max(255).optional(),
  descricao:     z.string().max(2000).nullable().optional(),
  preco:         z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  precoOriginal: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  urlImagem:     z.string().url().nullable().optional().or(z.literal('')),
  tema:          z.string().max(30).optional(),
  destacarHome:  z.union([z.literal(0), z.literal(1)]).optional(),
  ativo:         z.union([z.literal(0), z.literal(1)]).optional(),
  validoDesde:   z.string().datetime().nullable().optional(),
  validoAte:     z.string().datetime().nullable().optional(),
  itens:         z.array(schemaItem).min(1).optional(),
  alternarAtivo: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })
  }

  const body  = await req.json().catch(() => null)
  const parse = schemaEdicao.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  if (parse.data.alternarAtivo) {
    await alternarAtivoCombo(id)
    return NextResponse.json({ ok: true })
  }

  const { validoDesde, validoAte, urlImagem, alternarAtivo: _, ...resto } = parse.data
  try {
    await atualizarCombo(id, {
      ...resto,
      urlImagem:   urlImagem === '' ? null : urlImagem ?? undefined,
      validoDesde: validoDesde === undefined ? undefined : validoDesde ? new Date(validoDesde) : null,
      validoAte:   validoAte   === undefined ? undefined : validoAte   ? new Date(validoAte)   : null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar combo'
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ erro: 'ID inválido' }, { status: 400 })
  }

  await deletarCombo(id)
  return NextResponse.json({ ok: true })
}
