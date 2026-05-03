/**
 * Página de Detalhe do Produto — Felipe's Bakery
 *
 * Exibe todas as informações de um produto:
 *   - Galeria de imagens
 *   - Nome, categoria, peso, preço
 *   - Descrição e ingredientes
 *   - Seletor de quantidade + botão adicionar ao carrinho
 *   - Produtos relacionados (mesma categoria)
 *
 * Geração estática com ISR: gera as páginas de todos os produtos
 * no build e revalida a cada hora.
 */

import type { Metadata }             from 'next'
import Image                         from 'next/image'
import Link                          from 'next/link'
import { notFound }                  from 'next/navigation'
import { ChevronRight, Scale, Leaf }  from 'lucide-react'
import {
  buscarProdutoPorSlug,
  buscarSlugsProdutos,
  buscarProdutosRelacionados,
} from '@backend/modulos/produtos/queries'
import { BotaoAdicionarCarrinho }    from '@frontend/publico/produto/BotaoAdicionarCarrinho'
import { CartaoProduto }             from '@frontend/publico/catalogo/CartaoProduto'
import { Cracha }                    from '@frontend/compartilhado/ui/cracha'
import { Separador }                 from '@frontend/compartilhado/ui/separador'
import { formatarMoeda }             from '@compartilhado/utils'

// ── ISR ───────────────────────────────────────────────────────
export const revalidate = 3600

// ── Parâmetros estáticos ──────────────────────────────────────
// Gera uma página estática para cada produto no build.
// `buscarSlugsProdutos` retorna `{ slug: string }[]`, então mapeamos
// extraindo o campo `.slug` para o formato esperado pelo Next.
export async function generateStaticParams() {
  try {
    const registros = await buscarSlugsProdutos()
    return registros.map(({ slug }) => ({ slug }))
  } catch {
    // Banco indisponível no build → páginas geradas sob demanda em runtime
    return []
  }
}

// ── Metadata dinâmica ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug }  = await params
  const produto   = await buscarProdutoPorSlug(slug).catch(() => null)

  if (!produto) return { title: 'Produto não encontrado' }

  return {
    title: `${produto.nome} — Felipe's Bakery`,
    description: produto.descricao ?? `${produto.nome}, pão artesanal de fermentação natural da Felipe's Bakery.`,
    openGraph: {
      title:       produto.nome,
      description: produto.descricao ?? '',
      images:      produto.urlImagem ? [{ url: produto.urlImagem }] : [],
    },
  }
}

// Pequeno fallback para evitar checagens repetidas quando a categoria
// porventura não foi encontrada (não esperado em produtos publicados).
const CATEGORIA_FALLBACK = { id: 0, nome: 'Cardápio', slug: '' }

// ── Props ─────────────────────────────────────────────────────
interface PropsPaginaProduto {
  params: Promise<{ slug: string }>
}

// ── Página ────────────────────────────────────────────────────
export default async function PaginaProduto({ params }: PropsPaginaProduto) {
  const { slug }   = await params
  const produto    = await buscarProdutoPorSlug(slug).catch(() => null)

  // Produto não encontrado ou não publicado → 404
  if (!produto) notFound()

  const categoria = produto.categoria ?? CATEGORIA_FALLBACK

  // Busca produtos relacionados em paralelo
  const relacionados = await buscarProdutosRelacionados(produto.categoriaId, slug, 3).catch(() => [])

  const semEstoque = produto.estoqueQtd !== null && produto.estoqueQtd <= 0

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm text-stone-500" aria-label="Navegação">
          <Link href="/" className="hover:text-brand-600 transition-colors">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/catalogo" className="hover:text-brand-600 transition-colors">Cardápio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/catalogo?categoria=${categoria.slug}`}
            className="hover:text-brand-600 transition-colors"
          >
            {categoria.nome}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-stone-700 font-medium">{produto.nome}</span>
        </nav>

        {/* ── Layout Produto ───────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* Coluna esquerda: Imagem */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
            {produto.urlImagem ? (
              <Image
                src={produto.urlImagem}
                alt={produto.nome}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Leaf className="h-24 w-24 text-stone-300" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {produto.emDestaque === 1 && (
                <Cracha variante="padrao">Destaque</Cracha>
              )}
              {semEstoque && (
                <Cracha variante="secundario">Esgotado</Cracha>
              )}
            </div>
          </div>

          {/* Coluna direita: Informações */}
          <div className="flex flex-col">

            {/* Categoria */}
            <Link
              href={`/catalogo?categoria=${categoria.slug}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors uppercase tracking-wide"
            >
              {categoria.nome}
            </Link>

            {/* Nome */}
            <h1 className="mt-2 font-playfair text-3xl font-bold text-stone-900 leading-tight sm:text-4xl">
              {produto.nome}
            </h1>

            {/* Peso */}
            {produto.pesoGramas && (
              <div className="mt-2 flex items-center gap-1.5 text-stone-500">
                <Scale className="h-4 w-4" />
                <span className="text-sm">{produto.pesoGramas}g por unidade</span>
              </div>
            )}

            {/* Preço */}
            <div className="mt-5">
              {produto.precoCompare && (
                <span className="block text-sm text-stone-400 line-through">
                  {formatarMoeda(produto.precoCompare)}
                </span>
              )}
              <span className="text-3xl font-bold text-stone-900">
                {formatarMoeda(produto.preco)}
              </span>
              <span className="ml-2 text-sm text-stone-500">por unidade</span>
            </div>

            <Separador className="my-6" />

            {/* Descrição */}
            {produto.descricao && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Sobre
                </h2>
                <p className="text-stone-700 leading-relaxed">
                  {produto.descricao}
                </p>
              </div>
            )}

            {/* Ingredientes */}
            {produto.ingredientes && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Ingredientes
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {produto.ingredientes}
                </p>
              </div>
            )}

            <Separador className="my-2" />

            {/* Botão de adicionar ao carrinho */}
            <div className="mt-6">
              <BotaoAdicionarCarrinho produto={produto} />
            </div>

            {/* Info: ciclo de pedidos */}
            <div className="mt-6 rounded-lg bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm font-medium text-brand-800">
                Pedidos até quarta-feira às 23h
              </p>
              <p className="text-sm text-brand-600 mt-0.5">
                Entrega na sexta-feira
              </p>
            </div>

          </div>
        </div>

        {/* ── Produtos Relacionados ────────────────────────────── */}
        {relacionados.length > 0 && (
          <section className="mt-20">
            <h2 className="font-playfair text-2xl font-bold text-stone-900 mb-7">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((rel) => (
                <CartaoProduto key={rel.id} produto={rel} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
