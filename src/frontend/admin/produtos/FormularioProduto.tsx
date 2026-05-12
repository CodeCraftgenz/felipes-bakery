/**
 * FormularioProduto — Felipe's Bakery Admin
 *
 * Formulário de criação e edição de produto.
 * Client Component com react-hook-form + Zod.
 */

'use client'

import { useForm }          from 'react-hook-form'
import { zodResolver }      from '@hookform/resolvers/zod'
import { z }                from 'zod'
import { useRouter }        from 'next/navigation'
import { toast }            from 'sonner'
import { Loader2 }          from 'lucide-react'
import {
  Botao, Entrada, Rotulo, Separador,
} from '@frontend/compartilhado/ui'
import type { CriarProdutoInput } from '@backend/modulos/produtos/mutations'

// ── Schema de validação ───────────────────────────────────────

const schemaProduto = z.object({
  nome:          z.string().min(2, 'Nome obrigatório'),
  categoriaId:   z.coerce.number().min(1, 'Selecione uma categoria'),
  preco:         z.string().min(1, 'Preço obrigatório'),
  precoCompare:  z.string().optional(),
  pesoGramas:    z.coerce.number().optional(),
  descricao:     z.string().optional(),
  ingredientes:  z.string().optional(),
  emDestaque:    z.coerce.number().refine((v) => v === 0 || v === 1) as z.ZodType<0 | 1>,
  status:        z.enum(['published', 'draft', 'archived']),
})

type FormProduto = z.infer<typeof schemaProduto>

// ── Tipos ─────────────────────────────────────────────────────

interface Categoria {
  id:   number
  nome: string
}

interface FormularioProdutoProps {
  categorias:   Categoria[]
  /** Se fornecido, o formulário opera em modo edição */
  produtoId?:   number
  dadosIniciais?: Partial<FormProduto>
}

// ── Componente ────────────────────────────────────────────────

export function FormularioProduto({
  categorias,
  produtoId,
  dadosIniciais,
}: FormularioProdutoProps) {
  const router = useRouter()
  const modoEdicao = !!produtoId

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormProduto>({
    resolver: zodResolver(schemaProduto),
    defaultValues: {
      status:      'draft',
      emDestaque:  0,
      ...dadosIniciais,
    },
  })

  async function onSubmit(dados: FormProduto) {
    const url    = modoEdicao ? `/api/admin/produtos/${produtoId}` : '/api/admin/produtos'
    const method = modoEdicao ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dados),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao salvar produto')
      return
    }

    const json = await res.json().catch(() => ({}))

    if (modoEdicao) {
      toast.success('Produto atualizado!')
      router.push('/admin/produtos')
      router.refresh()
      return
    }

    // Após criar, vai direto para a edição para adicionar imagens
    toast.success('Produto criado! Adicione as imagens abaixo.')
    if (json?.id) {
      router.push(`/admin/produtos/${json.id}/editar`)
    } else {
      router.push('/admin/produtos')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações básicas */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Informações Básicas
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nome */}
          <div className="sm:col-span-2">
            <Rotulo htmlFor="nome">Nome do Produto *</Rotulo>
            <Entrada
              id="nome"
              {...register('nome')}
              erro={errors.nome?.message}
              placeholder="Ex: Pão de Fermentação Natural"
            />
          </div>

          {/* Categoria */}
          <div>
            <Rotulo htmlFor="categoriaId">Categoria *</Rotulo>
            <select
              id="categoriaId"
              {...register('categoriaId')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.categoriaId && (
              <p className="mt-1 text-xs text-destructive">{errors.categoriaId.message}</p>
            )}
          </div>

          {/* Peso */}
          <div>
            <Rotulo htmlFor="pesoGramas">Peso (gramas)</Rotulo>
            <Entrada
              id="pesoGramas"
              type="number"
              {...register('pesoGramas')}
              placeholder="Ex: 500"
            />
          </div>

          {/* Descrição */}
          <div className="sm:col-span-2">
            <Rotulo htmlFor="descricao">Descrição</Rotulo>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={3}
              placeholder="Descrição exibida na página do produto..."
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Ingredientes */}
          <div className="sm:col-span-2">
            <Rotulo htmlFor="ingredientes">Ingredientes / Composição</Rotulo>
            <textarea
              id="ingredientes"
              {...register('ingredientes')}
              rows={2}
              placeholder="Farinha de trigo tipo 1, água, sal, fermento natural..."
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Preços
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Rotulo htmlFor="preco">Preço de Venda *</Rotulo>
            <Entrada
              id="preco"
              {...register('preco')}
              erro={errors.preco?.message}
              placeholder="0.00"
            />
          </div>
          <div>
            <Rotulo htmlFor="precoCompare">Preço Original (riscado)</Rotulo>
            <Entrada
              id="precoCompare"
              {...register('precoCompare')}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Exibido riscado para indicar promoção
            </p>
          </div>
        </div>
      </section>

      {/* Publicação */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Publicação
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Rotulo htmlFor="status">Status</Rotulo>
            <select
              id="status"
              {...register('status')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          <div>
            <Rotulo htmlFor="emDestaque">Destaque na Home</Rotulo>
            <select
              id="emDestaque"
              {...register('emDestaque')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={0}>Não</option>
              <option value={1}>Sim — exibir na home</option>
            </select>
          </div>
        </div>
      </section>

      {/* Barra fixa no rodapé do viewport — fica sempre visível, mesmo
          rolando pelas seções de imagem/estoque que ficam abaixo do form */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-3xl flex-col-reverse items-stretch gap-2 px-4 py-3 sm:flex-row sm:justify-end">
          <Botao
            type="button"
            variante="contorno"
            onClick={() => router.push('/admin/produtos')}
          >
            Cancelar
          </Botao>
          <Botao type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modoEdicao ? 'Salvar dados do produto' : 'Criar produto'}
          </Botao>
        </div>
      </div>
    </form>
  )
}
