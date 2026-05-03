/**
 * Rota de setup — cria as tabelas no banco (usar apenas uma vez)
 * Protegida por SETUP_SECRET para evitar uso indevido.
 *
 * Uso: GET /api/setup?secret=SUA_SETUP_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db } from '@backend/lib/banco'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const setupSecret = process.env.SETUP_SECRET

  if (!setupSecret || secret !== setupSecret) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  try {
    const migrationsFolder = path.join(process.cwd(), 'banco', 'migrations')

    await migrate(db as never, { migrationsFolder })

    return NextResponse.json({
      ok: true,
      mensagem: 'Migrations aplicadas com sucesso!',
    })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    return NextResponse.json({ ok: false, erro: mensagem }, { status: 500 })
  }
}
