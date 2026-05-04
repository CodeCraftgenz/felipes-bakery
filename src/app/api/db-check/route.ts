/**
 * Diagnóstico de conexão e queries — remover após confirmar funcionamento
 * GET /api/db-check?secret=SEU_SETUP_SECRET
 */
import { NextRequest, NextResponse } from 'next/server'
import { eq, and, desc, asc, sql }   from 'drizzle-orm'
import { db }                         from '@backend/lib/banco'
import { produtos, categorias, imagensProduto, estoque } from '@schema'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const resultado: Record<string, unknown> = {}

  // 1. Testa conexão básica
  try {
    const cats = await db
      .select({ id: categorias.id, nome: categorias.nome })
      .from(categorias)
      .limit(5)
    resultado.categorias = cats
  } catch (e) {
    resultado.erro_categorias = String(e)
  }

  // 2. Conta produtos sem filtro
  try {
    const total = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(produtos)
    resultado.total_produtos_sem_filtro = total[0]?.total
  } catch (e) {
    resultado.erro_total = String(e)
  }

  // 3. Conta produtos com filtro igual ao catálogo
  try {
    const filtrado = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(produtos)
      .where(and(eq(produtos.ativo, 1), eq(produtos.status, 'published')))
    resultado.total_produtos_publicados = filtrado[0]?.total
  } catch (e) {
    resultado.erro_filtrado = String(e)
  }

  // 4. Amostra de produtos (sem subqueries)
  try {
    const amostra = await db
      .select({
        id:     produtos.id,
        nome:   produtos.nome,
        ativo:  produtos.ativo,
        status: produtos.status,
      })
      .from(produtos)
      .limit(5)
    resultado.amostra = amostra
  } catch (e) {
    resultado.erro_amostra = String(e)
  }

  // 5. Testa a query completa com subqueries (igual ao buscarProdutos)
  try {
    const subEstoque = sql<number>`COALESCE((SELECT quantity FROM stock WHERE product_id = ${produtos.id} LIMIT 1), 0)`
    const subImg     = sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${produtos.id} ORDER BY display_order ASC LIMIT 1)`

    const rows = await db
      .select({
        id:        produtos.id,
        nome:      produtos.nome,
        preco:     produtos.preco,
        urlImagem: subImg,
        estoque:   subEstoque,
      })
      .from(produtos)
      .leftJoin(categorias, eq(produtos.categoriaId, categorias.id))
      .where(and(eq(produtos.ativo, 1), eq(produtos.status, 'published')))
      .orderBy(desc(produtos.emDestaque), asc(produtos.nome))
      .limit(3)

    resultado.query_completa = rows
  } catch (e) {
    resultado.erro_query_completa = String(e)
  }

  return NextResponse.json({ ok: true, ...resultado })
}
