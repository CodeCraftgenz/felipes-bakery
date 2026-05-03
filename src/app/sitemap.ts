import type { MetadataRoute } from 'next'
import { db, produtos, categorias } from '@backend/lib/banco'
import { eq, and, isNull } from 'drizzle-orm'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://felipesbakery.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Páginas estáticas ──────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/catalogo`,                lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/sobre`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contato`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/politica-de-privacidade`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/termos-de-uso`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // ── Categorias ────────────────────────────────────────
  const todasCategorias = await db
    .select({ slug: categorias.slug, atualizadaEm: categorias.atualizadaEm })
    .from(categorias)
    .where(and(eq(categorias.ativa, 1), isNull(categorias.excluidaEm)))

  const categoryPages: MetadataRoute.Sitemap = todasCategorias.map((cat) => ({
    url:             `${BASE_URL}/categoria/${cat.slug}`,
    lastModified:    cat.atualizadaEm,
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  // ── Produtos ──────────────────────────────────────────
  const todosProdutos = await db
    .select({ slug: produtos.slug, atualizadoEm: produtos.atualizadoEm })
    .from(produtos)
    .where(
      and(
        eq(produtos.ativo, 1),
        eq(produtos.status, 'published'),
        isNull(produtos.excluidoEm),
      ),
    )

  const productPages: MetadataRoute.Sitemap = todosProdutos.map((prod) => ({
    url:             `${BASE_URL}/produto/${prod.slug}`,
    lastModified:    prod.atualizadoEm,
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}
