/**
 * Diagnóstico de conexão com o banco — remover após confirmar funcionamento
 * GET /api/db-check?secret=SEU_SETUP_SECRET
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@backend/lib/banco'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  try {
    const [produtos]   = await db.execute(sql`SELECT COUNT(*) as total FROM products WHERE is_active = 1 AND status = 'published'`)
    const [categorias] = await db.execute(sql`SELECT COUNT(*) as total FROM categories WHERE is_active = 1`)
    const [imagens]    = await db.execute(sql`SELECT COUNT(*) as total FROM product_images`)
    const amostra      = await db.execute(sql`SELECT id, name, slug, status, is_active FROM products LIMIT 5`)

    return NextResponse.json({
      ok: true,
      produtos:   produtos,
      categorias: categorias,
      imagens:    imagens,
      amostra:    amostra,
    })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    return NextResponse.json({ ok: false, erro: mensagem }, { status: 500 })
  }
}
