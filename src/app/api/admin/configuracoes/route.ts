/**
 * API Admin — Configurações da Loja
 * PATCH /api/admin/configuracoes → atualiza o singleton de configurações
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { auth }                      from '@backend/lib/auth'
import { atualizarConfiguracoes }    from '@backend/modulos/configuracoes/mutations'

const schemaConfig = z.object({
  nomeLoja:       z.string().min(2).max(255).optional(),
  whatsapp:       z.string().max(20).nullable().optional(),
  telefone:       z.string().max(20).nullable().optional(),
  emailContato:   z.string().email().nullable().optional().or(z.literal('').transform(() => null)),
  diaCorte:       z.number().int().min(0).max(6).optional(),
  horaCorte:      z.number().int().min(0).max(23).optional(),
  diaEntrega:     z.number().int().min(0).max(6).optional(),
  taxaFrete:      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato inválido (ex: 10.00)').optional(),
  modoManutencao: z.union([z.literal(0), z.literal(1)]).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body  = await req.json().catch(() => null)
  const parse = schemaConfig.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parse.error.flatten() },
      { status: 400 },
    )
  }

  await atualizarConfiguracoes(parse.data)
  return NextResponse.json({ ok: true })
}
