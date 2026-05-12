/**
 * Queries de Produtos — Felipe's Bakery
 *
 * Consultas do catálogo público e do painel admin.
 * Server-only.
 */

import 'server-only'
import { eq, desc, like, and, or, sql, asc } from 'drizzle-orm'
import { db }      from '@backend/lib/banco'
import { produtos, categorias, imagensProduto, estoque } from '@schema'
import type { ResultadoPaginado } from '@backend/modulos/pedidos/admin-queries'

// Subquery reutilizável para estoque
const subEstoque = sql<number>`COALESCE((SELECT quantity FROM stock WHERE product_id = ${produtos.id} LIMIT 1), 0)`

// Subquery reutilizável para a URL da imagem principal (primeira da galeria)
const subImagemPrincipal = sql<string | null>`(
  SELECT url FROM product_images
  WHERE product_id = ${produtos.id}
  ORDER BY display_order ASC LIMIT 1
)`

// ── Tipos ─────────────────────────────────────────────────────

/** Tipo retornado pelas queries públicas de catálogo e home */
export type ProdutoResumo = {
  id:              number
  nome:            string
  slug:            string
  descricao:       string | null
  preco:           string
  precoCompare:    string | null
  pesoGramas:      number | null
  emDestaque:      number
  categoriaId:     number
  nomeCategoria:   string | null
  urlImagem:       string | null
  estoqueQtd:      number
}

export type ProdutoAdmin = {
  id:            number
  nome:          string
  slug:          string
  preco:         string
  precoCompare:  string | null
  status:        string
  emDestaque:    number
  ativo:         number
  categoriaId:   number
  nomeCategoria: string | null
  estoque:       number
  criadoEm:      Date
}

export type FiltrosProdutoAdmin = {
  busca?:       string
  status?:      string
  categoriaId?: number
  pagina?:      number
  porPagina?:   number
}

// ── Funções públicas ──────────────────────────────────────────

/**
 * Busca produtos ativos e publicados para o catálogo público.
 * Filtra por categoria e/ou busca de texto.
 */
export async function buscarProdutos(categoriaSlug?: string, busca?: string) {
  const condicoes: any[] = [
    eq(produtos.ativo, 1),
    eq(produtos.status, 'published'),
  ]

  if (categoriaSlug) {
    const [cat] = await db
      .select({ id: categorias.id })
      .from(categorias)
      .where(eq(categorias.slug, categoriaSlug))
      .limit(1)
    if (cat) condicoes.push(eq(produtos.categoriaId, cat.id))
  }

  const where = busca
    ? and(...condicoes, like(produtos.nome, `%${busca}%`))
    : and(...condicoes)

  const rows = await db
    .select({
      id:            produtos.id,
      nome:          produtos.nome,
      slug:          produtos.slug,
      descricao:     produtos.descricao,
      preco:         produtos.preco,
      precoCompare:  produtos.precoComparacao,
      pesoGramas:    produtos.pesoGramas,
      emDestaque:    produtos.emDestaque,
      categoriaId:   produtos.categoriaId,
      nomeCategoria: categorias.nome,
      urlImagem:     subImagemPrincipal,
      estoqueQtd:    subEstoque,
    })
    .from(produtos)
    .leftJoin(categorias, eq(produtos.categoriaId, categorias.id))
    .where(where)
    .orderBy(desc(produtos.emDestaque), asc(produtos.nome))

  return rows.map((r) => ({ ...r, estoqueQtd: Number(r.estoqueQtd) }))
}

/**
 * Busca os produtos em destaque para a home.
 */
export async function buscarProdutosDestaque(limite = 6): Promise<ProdutoResumo[]> {
  const rows = await db
    .select({
      id:            produtos.id,
      nome:          produtos.nome,
      slug:          produtos.slug,
      descricao:     produtos.descricao,
      preco:         produtos.preco,
      precoCompare:  produtos.precoComparacao,
      pesoGramas:    produtos.pesoGramas,
      emDestaque:    produtos.emDestaque,
      categoriaId:   produtos.categoriaId,
      nomeCategoria: categorias.nome,
      urlImagem:     subImagemPrincipal,
      estoqueQtd:    subEstoque,
    })
    .from(produtos)
    .leftJoin(categorias, eq(produtos.categoriaId, categorias.id))
    .where(and(eq(produtos.ativo, 1), eq(produtos.status, 'published'), eq(produtos.emDestaque, 1)))
    .orderBy(desc(produtos.criadoEm))
    .limit(limite)

  return rows.map((r) => ({ ...r, estoqueQtd: Number(r.estoqueQtd) }))
}

/**
 * Busca um produto pelo slug, incluindo imagens, categoria e estoque.
 * Retorna null se não encontrado ou inativo.
 */
export async function buscarProdutoPorSlug(slug: string) {
  const [produto] = await db
    .select({
      id:            produtos.id,
      nome:          produtos.nome,
      slug:          produtos.slug,
      descricao:     produtos.descricao,
      ingredientes:  produtos.ingredientes,
      preco:         produtos.preco,
      precoCompare:  produtos.precoComparacao,
      pesoGramas:    produtos.pesoGramas,
      emDestaque:    produtos.emDestaque,
      categoriaId:   produtos.categoriaId,
      status:        produtos.status,
      categoriaNome: categorias.nome,
      categoriaSlug: categorias.slug,
    })
    .from(produtos)
    .leftJoin(categorias, eq(produtos.categoriaId, categorias.id))
    .where(and(eq(produtos.slug, slug), eq(produtos.ativo, 1), eq(produtos.status, 'published')))
    .limit(1)

  if (!produto) return null

  // Busca imagens + estoque em paralelo
  const [imagens, estoqueRes] = await Promise.all([
    db
      .select({ id: imagensProduto.id, url: imagensProduto.url, ordemExibicao: imagensProduto.ordemExibicao })
      .from(imagensProduto)
      .where(eq(imagensProduto.produtoId, produto.id))
      .orderBy(asc(imagensProduto.ordemExibicao)),

    db
      .select({ quantidade: estoque.quantidade })
      .from(estoque)
      .where(eq(estoque.produtoId, produto.id))
      .limit(1),
  ])

  // Imagem principal = primeira da galeria (já ordenada)
  const urlImagem = imagens[0]?.url ?? null

  // Estrutura aninhada `categoria` para uso conveniente nos componentes
  const categoria = produto.categoriaNome
    ? { id: produto.categoriaId, nome: produto.categoriaNome, slug: produto.categoriaSlug ?? '' }
    : null

  return {
    id:           produto.id,
    nome:         produto.nome,
    slug:         produto.slug,
    descricao:    produto.descricao,
    ingredientes: produto.ingredientes,
    preco:        produto.preco,
    precoCompare: produto.precoCompare,
    pesoGramas:   produto.pesoGramas,
    emDestaque:   produto.emDestaque,
    categoriaId:  produto.categoriaId,
    status:       produto.status,
    imagens,
    urlImagem,
    categoria,
    estoqueQtd: estoqueRes[0]?.quantidade ?? 0,
  }
}

/** Tipo derivado do retorno de `buscarProdutoPorSlug` (inclui imagens e categoria). */
export type ProdutoCompleto = NonNullable<Awaited<ReturnType<typeof buscarProdutoPorSlug>>>

/**
 * Retorna todos os slugs de produtos publicados (para generateStaticParams).
 */
export async function buscarSlugsProdutos() {
  return db
    .select({ slug: produtos.slug })
    .from(produtos)
    .where(and(eq(produtos.ativo, 1), eq(produtos.status, 'published')))
}

/**
 * Busca produtos relacionados (mesma categoria, excluindo o atual).
 * Retorna no formato `ProdutoResumo` para uso direto no `<CartaoProduto>`.
 */
export async function buscarProdutosRelacionados(
  categoriaId: number,
  excluirSlug:  string,
  limite = 3,
): Promise<ProdutoResumo[]> {
  const rows = await db
    .select({
      id:            produtos.id,
      nome:          produtos.nome,
      slug:          produtos.slug,
      descricao:     produtos.descricao,
      preco:         produtos.preco,
      precoCompare:  produtos.precoComparacao,
      pesoGramas:    produtos.pesoGramas,
      emDestaque:    produtos.emDestaque,
      categoriaId:   produtos.categoriaId,
      nomeCategoria: categorias.nome,
      urlImagem:     subImagemPrincipal,
      estoqueQtd:    subEstoque,
    })
    .from(produtos)
    .leftJoin(categorias, eq(produtos.categoriaId, categorias.id))
    .where(and(
      eq(produtos.categoriaId, categoriaId),
      eq(produtos.ativo, 1),
      eq(produtos.status, 'published'),
      sql`${produtos.slug} != ${excluirSlug}`,
    ))
    .limit(limite)

  return rows.map((r) => ({ ...r, estoqueQtd: Number(r.estoqueQtd) }))
}

// ── Funções admin ─────────────────────────────────────────────

/**
 * Lista todos os produtos para o painel admin com filtros e paginação.
 */
export async function listarProdutosAdmin(
  filtros: FiltrosProdutoAdmin = {},
): Promise<ResultadoPaginado<ProdutoAdmin>> {
  const { busca, status, categoriaId, pagina = 1, porPagina = 20 } = filtros
  const offset = (pagina - 1) * porPagina

  const condicoes: any[] = []
  if (busca)       condicoes.push(or(like(produtos.nome, `%${busca}%`), like(produtos.slug, `%${busca}%`)))
  if (status)      condicoes.push(eq(produtos.status, status as any))
  if (categoriaId) condicoes.push(eq(produtos.categoriaId, categoriaId))

  const where = condicoes.length > 0 ? and(...condicoes) : undefined

  const [countRes, itens] = await Promise.all([
    db.select({ total: sql<number>`COUNT(*)` }).from(produtos).where(where),
    db
      .select({
        id:            produtos.id,
        nome:          produtos.nome,
        slug:          produtos.slug,
        preco:         produtos.preco,
        precoCompare:  produtos.precoComparacao,
        status:        produtos.status,
        emDestaque:    produtos.emDestaque,
        ativo:         produtos.ativo,
        categoriaId:   produtos.categoriaId,
        nomeCategoria: categorias.nome,
        estoque:       sql<number>`COALESCE((SELECT quantity FROM stock WHERE product_id = ${produtos.id} LIMIT 1), 0)`,
        criadoEm:      produtos.criadoEm,
      })
      .from(produtos)
      .leftJoin(categorias, eq(produtos.categoriaId, categorias.id))
      .where(where)
      .orderBy(desc(produtos.criadoEm))
      .limit(porPagina)
      .offset(offset),
  ])

  const total = Number(countRes[0]?.total ?? 0)
  return {
    itens: itens.map((i) => ({ ...i, estoque: Number(i.estoque) })),
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  }
}

/**
 * Busca um produto pelo ID para o formulário de edição.
 */
export async function buscarProdutoPorId(id: number) {
  const [produto] = await db
    .select()
    .from(produtos)
    .where(eq(produtos.id, id))
    .limit(1)

  return produto ?? null
}

/**
 * Lista todas as imagens de um produto ordenadas pela posição na galeria.
 * Usada pelo gerenciador de imagens no painel admin.
 */
export type ImagemProduto = {
  id:               number
  url:              string
  ordemExibicao:    number
  principal:        number
  textoAlternativo: string | null
}

export async function listarImagensProduto(produtoId: number): Promise<ImagemProduto[]> {
  return db
    .select({
      id:               imagensProduto.id,
      url:              imagensProduto.url,
      ordemExibicao:    imagensProduto.ordemExibicao,
      principal:        imagensProduto.principal,
      textoAlternativo: imagensProduto.textoAlternativo,
    })
    .from(imagensProduto)
    .where(eq(imagensProduto.produtoId, produtoId))
    .orderBy(asc(imagensProduto.ordemExibicao))
}
