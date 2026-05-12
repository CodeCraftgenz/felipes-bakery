/**
 * GerenciadorImagensProduto — Felipe's Bakery Admin
 *
 * Permite ao admin gerenciar as imagens de um produto:
 *   - Adicionar nova imagem por URL (Pexels, Unsplash, S3, etc.)
 *   - Marcar uma imagem como principal (capa do card)
 *   - Remover imagens individualmente
 *
 * Por enquanto trabalhamos só com URLs (sem upload de arquivo nativo)
 * pois a aplicação ainda não tem storage configurado (S3/R2). Quando o
 * upload direto for liberado, basta adicionar um <input type="file" />
 * que chame /api/upload e cole a URL retornada aqui.
 */

'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { toast }       from 'sonner'
import { Loader2, Plus, Star, Trash2, Image as ImageIcon } from 'lucide-react'
import { Botao }       from '@frontend/compartilhado/ui'
import { CampoImagemUpload } from '@frontend/admin/compartilhado/CampoImagemUpload'
import type { ImagemProduto } from '@backend/modulos/produtos/queries'

interface Props {
  produtoId:        number
  imagensIniciais:  ImagemProduto[]
}

export function GerenciadorImagensProduto({ produtoId, imagensIniciais }: Props) {
  const router = useRouter()
  const [imagens, setImagens] = useState<ImagemProduto[]>(imagensIniciais)
  const [urlNova, setUrlNova] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function adicionar() {
    if (!urlNova.trim()) {
      toast.error('Cole uma URL de imagem')
      return
    }
    setCarregando(true)
    try {
      const res = await fetch(`/api/admin/produtos/${produtoId}/imagens`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: urlNova.trim(), ordemExibicao: imagens.length }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.erro ?? 'Erro ao adicionar imagem')
        return
      }
      toast.success('Imagem adicionada!')
      setUrlNova('')
      // Recarrega a lista
      const respLista = await fetch(`/api/admin/produtos/${produtoId}/imagens`)
      const json      = await respLista.json()
      setImagens(json.imagens)
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  async function remover(imgId: number) {
    if (!confirm('Remover esta imagem?')) return
    const res = await fetch(`/api/admin/produtos/${produtoId}/imagens/${imgId}`, {
      method: 'DELETE',
    })
    if (!res.ok) return toast.error('Erro ao remover imagem')
    toast.success('Imagem removida')
    setImagens((arr) => arr.filter((i) => i.id !== imgId))
    router.refresh()
  }

  async function tornarPrincipal(imgId: number) {
    const res = await fetch(`/api/admin/produtos/${produtoId}/imagens/${imgId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ principal: true }),
    })
    if (!res.ok) return toast.error('Erro ao definir como principal')
    toast.success('Imagem principal definida')
    setImagens((arr) =>
      arr.map((i) => ({ ...i, principal: i.id === imgId ? 1 : 0 })),
    )
    router.refresh()
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Imagens do Produto
      </h2>

      {/* Adicionar nova imagem (URL ou upload) */}
      <div className="space-y-3">
        <CampoImagemUpload
          id="url-imagem"
          label="Adicionar imagem (URL ou enviar do dispositivo)"
          value={urlNova}
          onChange={setUrlNova}
        />
        <div className="flex justify-end">
          <Botao type="button" onClick={adicionar} disabled={carregando || !urlNova.trim()}>
            {carregando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Adicionar à galeria
          </Botao>
        </div>
      </div>

      {/* Galeria */}
      <div className="mt-6">
        {imagens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 py-10 text-center">
            <ImageIcon className="h-10 w-10 text-stone-300" />
            <p className="text-sm text-muted-foreground">
              Nenhuma imagem cadastrada para este produto.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {imagens.map((img) => (
              <li
                key={img.id}
                className={`group relative overflow-hidden rounded-lg border bg-stone-50 ${
                  img.principal === 1 ? 'border-brand-500 ring-2 ring-brand-200' : 'border-stone-200'
                }`}
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.textoAlternativo ?? 'Imagem do produto'}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {img.principal === 1 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                    <Star className="h-3 w-3 fill-white" /> Capa
                  </span>
                )}

                {/* Ações */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {img.principal === 1 ? (
                    <span className="text-xs font-medium text-white/90">Capa atual</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => tornarPrincipal(img.id)}
                      className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-white"
                    >
                      Tornar capa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remover(img.id)}
                    className="rounded bg-red-500/90 p-1 text-white hover:bg-red-600"
                    aria-label="Remover imagem"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
