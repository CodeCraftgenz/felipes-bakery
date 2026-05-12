/**
 * GerenciadorCategorias — Felipe's Bakery Admin
 *
 * Lista de categorias com:
 *   - Contagem de produtos em cada categoria
 *   - Atalho "Ver produtos" → abre listagem filtrada
 *   - Atalho "+ Adicionar produto" → abre criação já com a categoria pré-selecionada
 *   - Edição inline de nome/descrição
 *   - Desativação (soft delete)
 *
 * Client Component.
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import Link                        from 'next/link'
import { toast }                   from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, Check, X,
  Package, ExternalLink,
} from 'lucide-react'
import {
  Botao, Entrada, Cartao, CartaoConteudo,
} from '@frontend/compartilhado/ui'
import type { CategoriaComContagem } from '@backend/modulos/categorias/queries'

interface Props {
  categorias: CategoriaComContagem[]
}

export function GerenciadorCategorias({ categorias }: Props) {
  const router               = useRouter()
  const [isPending, startT]  = useTransition()

  // Estado de criação
  const [criando, setCriando]   = useState(false)
  const [novoNome, setNovo]     = useState('')
  const [novaDesc, setNovaDesc] = useState('')

  // Estado de edição
  const [editandoId, setEditId] = useState<number | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editDesc, setEditDesc] = useState('')

  async function criar() {
    if (!novoNome.trim()) { toast.error('Informe o nome'); return }
    const res = await fetch('/api/admin/categorias', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: novoNome.trim(), descricao: novaDesc || null }),
    })
    if (res.ok) {
      toast.success('Categoria criada!')
      setNovo(''); setNovaDesc(''); setCriando(false)
      startT(() => router.refresh())
    } else {
      toast.error('Erro ao criar categoria')
    }
  }

  function iniciarEdicao(cat: CategoriaComContagem) {
    setEditId(cat.id)
    setEditNome(cat.nome)
    setEditDesc(cat.descricao ?? '')
  }

  async function salvarEdicao(id: number) {
    if (!editNome.trim()) { toast.error('Informe o nome'); return }
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: editNome.trim(), descricao: editDesc || null }),
    })
    if (res.ok) {
      toast.success('Categoria atualizada!')
      setEditId(null)
      startT(() => router.refresh())
    } else {
      toast.error('Erro ao atualizar')
    }
  }

  async function desativar(id: number, nome: string, total: number) {
    const aviso = total > 0
      ? `Desativar "${nome}"?\n\nEla contém ${total} produto(s) que ficarão sem categoria.`
      : `Desativar "${nome}"?`
    if (!confirm(aviso)) return
    const res = await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Categoria desativada')
      startT(() => router.refresh())
    } else {
      toast.error('Erro ao desativar')
    }
  }

  return (
    <div className="space-y-4">
      {/* Card-grid de categorias */}
      {categorias.length === 0 ? (
        <Cartao>
          <CartaoConteudo className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma categoria cadastrada. Clique em &quot;Nova Categoria&quot; abaixo.
          </CartaoConteudo>
        </Cartao>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((cat) => (
            <li key={cat.id}>
              <Cartao className="h-full">
                <CartaoConteudo className="flex h-full flex-col gap-3 p-4">
                  {editandoId === cat.id ? (
                    // ── Modo edição inline ────────────────────
                    <div className="space-y-2">
                      <Entrada
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        placeholder="Nome"
                      />
                      <Entrada
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Descrição"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-stone-100"
                          aria-label="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => salvarEdicao(cat.id)}
                          disabled={isPending}
                          className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                          aria-label="Salvar"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── Modo leitura ──────────────────────────
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-900">{cat.nome}</p>
                          {cat.descricao && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {cat.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(cat)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-stone-100"
                            title="Editar categoria"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => desativar(cat.id, cat.nome, cat.totalProdutos)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title="Desativar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Contagem de produtos */}
                      <div className="flex items-center gap-2 rounded-md bg-brand-50 px-3 py-2 text-sm">
                        <Package className="h-4 w-4 text-brand-600" />
                        <span className="font-medium text-stone-700">
                          {cat.totalProdutos} produto{cat.totalProdutos === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* Atalhos */}
                      <div className="mt-auto grid grid-cols-2 gap-2">
                        <Link
                          href={`/admin/produtos?categoriaId=${cat.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                        >
                          <ExternalLink className="h-3 w-3" /> Ver produtos
                        </Link>
                        <Link
                          href={`/admin/produtos/novo?categoriaId=${cat.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                        >
                          <Plus className="h-3 w-3" /> Adicionar
                        </Link>
                      </div>
                    </>
                  )}
                </CartaoConteudo>
              </Cartao>
            </li>
          ))}
        </ul>
      )}

      {/* Formulário de nova categoria */}
      {criando ? (
        <Cartao>
          <CartaoConteudo className="space-y-3 p-4">
            <p className="text-sm font-medium">Nova Categoria</p>
            <Entrada
              value={novoNome}
              onChange={(e) => setNovo(e.target.value)}
              placeholder="Nome da categoria *"
              autoFocus
            />
            <Entrada
              value={novaDesc}
              onChange={(e) => setNovaDesc(e.target.value)}
              placeholder="Descrição (opcional)"
            />
            <div className="flex justify-end gap-2">
              <Botao variante="contorno" tamanho="p" onClick={() => setCriando(false)}>
                Cancelar
              </Botao>
              <Botao tamanho="p" onClick={criar} disabled={isPending}>
                {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Criar
              </Botao>
            </div>
          </CartaoConteudo>
        </Cartao>
      ) : (
        <Botao variante="contorno" tamanho="p" onClick={() => setCriando(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Categoria
        </Botao>
      )}
    </div>
  )
}
