/**
 * GerenciadorCategorias — Felipe's Bakery Admin
 *
 * Lista de categorias com criação inline e ações de editar/desativar.
 * Client Component.
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { toast }                   from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'
import {
  Botao, Entrada, Cartao, CartaoConteudo,
} from '@frontend/compartilhado/ui'
import type { CategoriaResumo } from '@backend/modulos/categorias/queries'

interface GerenciadorCategoriasProps {
  categorias: CategoriaResumo[]
}

export function GerenciadorCategorias({ categorias }: GerenciadorCategoriasProps) {
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome.trim(), descricao: novaDesc || null }),
    })
    if (res.ok) {
      toast.success('Categoria criada!')
      setNovo(''); setNovaDesc(''); setCriando(false)
      startT(() => router.refresh())
    } else {
      toast.error('Erro ao criar categoria')
    }
  }

  function iniciarEdicao(cat: CategoriaResumo) {
    setEditId(cat.id)
    setEditNome(cat.nome)
    setEditDesc(cat.descricao ?? '')
  }

  async function salvarEdicao(id: number) {
    if (!editNome.trim()) { toast.error('Informe o nome'); return }
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editNome.trim(), descricao: editDesc || null }),
    })
    if (res.ok) {
      toast.success('Categoria atualizada!')
      setEditId(null)
      startT(() => router.refresh())
    } else {
      toast.error('Erro ao atualizar')
    }
  }

  async function desativar(id: number, nome: string) {
    if (!confirm(`Desativar "${nome}"? Os produtos desta categoria não serão removidos.`)) return
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
      {/* Lista de categorias */}
      <Cartao>
        <CartaoConteudo className="p-0">
          <ul className="divide-y divide-border">
            {categorias.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma categoria cadastrada.
              </li>
            )}
            {categorias.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
                {/* Ordem */}
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                  {cat.ordemExibicao}
                </span>

                {/* Nome / edição inline */}
                {editandoId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Entrada
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="flex-1"
                      placeholder="Nome"
                    />
                    <Entrada
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="flex-1"
                      placeholder="Descrição"
                    />
                    <button
                      type="button"
                      onClick={() => salvarEdicao(cat.id)}
                      disabled={isPending}
                      className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-stone-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="font-medium">{cat.nome}</p>
                    {cat.descricao && (
                      <p className="text-xs text-muted-foreground">{cat.descricao}</p>
                    )}
                  </div>
                )}

                {/* Ações */}
                {editandoId !== cat.id && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(cat)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => desativar(cat.id, cat.nome)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      title="Desativar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CartaoConteudo>
      </Cartao>

      {/* Formulário de nova categoria */}
      {criando ? (
        <Cartao>
          <CartaoConteudo className="space-y-3">
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
