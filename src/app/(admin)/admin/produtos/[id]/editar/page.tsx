/**
 * Página Editar Produto — Felipe's Bakery Admin
 */

import type { Metadata }      from 'next'
import { auth }               from '@backend/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link                   from 'next/link'
import { ChevronLeft }        from 'lucide-react'
import {
  buscarProdutoPorId,
  listarImagensProduto,
} from '@backend/modulos/produtos/queries'
import { buscarCategorias }            from '@backend/modulos/categorias/queries'
import { buscarEstoqueProduto }        from '@backend/modulos/estoque/queries'
import { FormularioProduto }           from '@frontend/admin/produtos/FormularioProduto'
import { GerenciadorImagensProduto }   from '@frontend/admin/produtos/GerenciadorImagensProduto'
import { GerenciadorEstoqueProduto }   from '@frontend/admin/produtos/GerenciadorEstoqueProduto'

export const metadata: Metadata = {
  title:  'Editar Produto — Admin',
  robots: { index: false, follow: false },
}

interface EditarProdutoPageProps {
  params: { id: string }
}

export default async function EditarProdutoPage({ params }: EditarProdutoPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const id = Number(params.id)
  if (isNaN(id)) notFound()

  const [produto, categorias, imagens, estoqueProduto] = await Promise.all([
    buscarProdutoPorId(id),
    buscarCategorias(),
    listarImagensProduto(id),
    buscarEstoqueProduto(id),
  ])

  if (!produto) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/produtos"
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Produtos
        </Link>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Editar Produto</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{produto.nome}</p>
      </div>

      <FormularioProduto
        produtoId={produto.id}
        categorias={categorias}
        dadosIniciais={{
          nome:         produto.nome,
          categoriaId:  produto.categoriaId,
          preco:        produto.preco,
          precoCompare: produto.precoComparacao ?? undefined,
          pesoGramas:   produto.pesoGramas ?? undefined,
          descricao:    produto.descricao ?? undefined,
          ingredientes: produto.ingredientes ?? undefined,
          emDestaque:   produto.emDestaque as 0 | 1,
          status:       produto.status as 'published' | 'draft' | 'archived',
        }}
      />

      <GerenciadorImagensProduto
        produtoId={produto.id}
        imagensIniciais={imagens}
      />

      <GerenciadorEstoqueProduto
        produtoId={produto.id}
        quantidade={estoqueProduto.quantidade}
        alertaMinimo={estoqueProduto.alertaMinimo}
      />
    </div>
  )
}
