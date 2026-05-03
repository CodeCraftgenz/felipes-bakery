/**
 * TabelaProdutos — Felipe's Bakery Admin
 *
 * Tabela de gerenciamento de produtos com ações inline.
 * Client Component (interações de status e exclusão).
 */

'use client'

import { useState, useTransition }    from 'react'
import Link                           from 'next/link'
import { useRouter }                  from 'next/navigation'
import { toast }                      from 'sonner'
import {
  MoreVertical, Pencil, Trash2, Eye, EyeOff, Star,
} from 'lucide-react'
import {
  Cracha, Botao, Dialogo, DialogoConteudo, DialogoCabecalho,
  DialogoTitulo, DialogoDescricao, DialogoRodape,
} from '@frontend/compartilhado/ui'
import type { ProdutoAdmin } from '@backend/modulos/produtos/queries'

// Configuração visual dos status
const CONFIG_STATUS: Record<string, { rotulo: string; variante: 'sucesso' | 'secundario' | 'contorno' }> = {
  published: { rotulo: 'Publicado', variante: 'sucesso'    },
  draft:     { rotulo: 'Rascunho', variante: 'secundario'  },
  archived:  { rotulo: 'Arquivado', variante: 'contorno'   },
}

function formatarMoeda(valor: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))
}

interface TabelaProdutosProps {
  produtos: ProdutoAdmin[]
}

export function TabelaProdutos({ produtos }: TabelaProdutosProps) {
  const router                            = useRouter()
  const [isPending, startTransition]      = useTransition()
  const [confirmandoExclusao, setConfirm] = useState<ProdutoAdmin | null>(null)
  const [menuAberto, setMenuAberto]       = useState<number | null>(null)

  /** Alterna o status entre published e draft */
  async function alternarStatus(produto: ProdutoAdmin) {
    const novoStatus = produto.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/admin/produtos/${produto.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    })
    if (res.ok) {
      toast.success(novoStatus === 'published' ? 'Produto publicado' : 'Produto despublicado')
      startTransition(() => router.refresh())
    } else {
      toast.error('Erro ao alterar status')
    }
  }

  /** Soft-delete do produto */
  async function excluirProduto(id: number) {
    const res = await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Produto excluído')
      startTransition(() => router.refresh())
    } else {
      toast.error('Erro ao excluir produto')
    }
    setConfirm(null)
  }

  return (
    <>
      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {produtos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {produtos.map((produto) => {
              const cfgStatus = CONFIG_STATUS[produto.status] ?? CONFIG_STATUS.draft
              return (
                <tr key={produto.id} className="hover:bg-stone-50/60">
                  {/* Nome + slug */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {produto.emDestaque === 1 && (
                        <Star className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" fill="currentColor" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">{produto.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {produto.nomeCategoria ?? '—'}
                  </td>

                  {/* Preço */}
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatarMoeda(produto.preco)}</p>
                    {produto.precoCompare && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatarMoeda(produto.precoCompare)}
                      </p>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="px-4 py-3">
                    <span className={produto.estoque <= 3 ? 'font-semibold text-red-600' : 'text-foreground'}>
                      {produto.estoque} un.
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Cracha variante={cfgStatus.variante} className="text-xs">
                      {cfgStatus.rotulo}
                    </Cracha>
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Publicar / despublicar */}
                      <button
                        type="button"
                        onClick={() => alternarStatus(produto)}
                        disabled={isPending}
                        title={produto.status === 'published' ? 'Despublicar' : 'Publicar'}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground disabled:opacity-50"
                      >
                        {produto.status === 'published'
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye    className="h-4 w-4" />
                        }
                      </button>

                      {/* Editar */}
                      <Link
                        href={`/admin/produtos/${produto.id}/editar`}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      {/* Excluir */}
                      <button
                        type="button"
                        onClick={() => setConfirm(produto)}
                        title="Excluir"
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <Dialogo open={!!confirmandoExclusao} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogoConteudo>
          <DialogoCabecalho>
            <DialogoTitulo>Excluir produto?</DialogoTitulo>
            <DialogoDescricao>
              &ldquo;{confirmandoExclusao?.nome}&rdquo; será arquivado. O histórico de pedidos é preservado.
              Esta ação não pode ser desfeita.
            </DialogoDescricao>
          </DialogoCabecalho>
          <DialogoRodape>
            <Botao variante="contorno" onClick={() => setConfirm(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              onClick={() => confirmandoExclusao && excluirProduto(confirmandoExclusao.id)}
            >
              Excluir
            </Botao>
          </DialogoRodape>
        </DialogoConteudo>
      </Dialogo>
    </>
  )
}
