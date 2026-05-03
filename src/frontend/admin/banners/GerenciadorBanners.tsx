/**
 * GerenciadorBanners — Felipe's Bakery Admin
 *
 * Client Component que lista, cria, edita, ativa/desativa e remove banners.
 */

'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { useForm }        from 'react-hook-form'
import { zodResolver }    from '@hookform/resolvers/zod'
import { z }              from 'zod'
import { toast }          from 'sonner'
import { Loader2, Plus, Trash2, Power, Pencil } from 'lucide-react'
import {
  Botao, Entrada, Rotulo, Cracha,
} from '@frontend/compartilhado/ui'
import type { Banner } from '@schema'

// ── Schema do formulário ──────────────────────────────────────
const schemaBanner = z.object({
  titulo:        z.string().min(2, 'Título obrigatório'),
  urlImagem:     z.string().url('URL de imagem inválida'),
  urlLink:       z.string().url('URL de link inválida').optional().or(z.literal('')),
  ordemExibicao: z.coerce.number().int().min(0).default(0),
  validoAte:     z.string().optional(),
})

type FormBanner = z.infer<typeof schemaBanner>

interface Props {
  bannersIniciais: Banner[]
}

// ── Componente ────────────────────────────────────────────────
export function GerenciadorBanners({ bannersIniciais }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [bannerEditando, setBannerEditando] = useState<Banner | null>(null)

  function abrirCriacao() {
    setBannerEditando(null)
    setAberto(true)
  }

  function abrirEdicao(b: Banner) {
    setBannerEditando(b)
    setAberto(true)
  }

  async function alternarAtivo(id: number) {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ alternarAtivo: true }),
    })
    if (!res.ok) { toast.error('Erro ao alternar status'); return }
    toast.success('Status atualizado')
    router.refresh()
  }

  async function deletar(id: number) {
    if (!confirm('Tem certeza que deseja remover este banner?')) return
    const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Erro ao remover banner'); return }
    toast.success('Banner removido')
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <Botao onClick={abrirCriacao}>
          <Plus className="mr-1 h-4 w-4" /> Novo Banner
        </Botao>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Imagem</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3 text-center">Ordem</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bannersIniciais.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum banner cadastrado.
                </td>
              </tr>
            )}
            {bannersIniciais.map((b) => (
              <tr key={b.id} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.urlImagem}
                    alt={b.titulo}
                    className="h-12 w-20 rounded object-cover"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{b.titulo}</td>
                <td className="px-4 py-3 truncate max-w-xs text-xs text-stone-500">
                  {b.urlLink ?? '—'}
                </td>
                <td className="px-4 py-3 text-center">{b.ordemExibicao}</td>
                <td className="px-4 py-3 text-center">
                  <Cracha variante={b.ativo ? 'padrao' : 'secundario'}>
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </Cracha>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => abrirEdicao(b)}
                      title="Editar"
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alternarAtivo(b.id)}
                      title={b.ativo ? 'Desativar' : 'Ativar'}
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletar(b.id)}
                      title="Remover"
                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aberto && (
        <ModalBanner
          banner={bannerEditando}
          aoFechar={() => setAberto(false)}
          aoSalvar={() => {
            setAberto(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

// ── Modal de criação/edição ──────────────────────────────────
function ModalBanner({
  banner,
  aoFechar,
  aoSalvar,
}: {
  banner: Banner | null
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const modoEdicao = !!banner

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormBanner>({
    resolver: zodResolver(schemaBanner),
    defaultValues: banner
      ? {
          titulo:        banner.titulo,
          urlImagem:     banner.urlImagem,
          urlLink:       banner.urlLink ?? '',
          ordemExibicao: banner.ordemExibicao,
          validoAte:     banner.validoAte
            ? new Date(banner.validoAte).toISOString().slice(0, 10)
            : '',
        }
      : { ordemExibicao: 0 },
  })

  async function onSubmit(dados: FormBanner) {
    const url    = modoEdicao ? `/api/admin/banners/${banner!.id}` : '/api/admin/banners'
    const method = modoEdicao ? 'PATCH' : 'POST'

    const payload: Record<string, unknown> = {
      titulo:        dados.titulo,
      urlImagem:     dados.urlImagem,
      urlLink:       dados.urlLink || null,
      ordemExibicao: dados.ordemExibicao,
      validoAte:     dados.validoAte ? new Date(dados.validoAte).toISOString() : null,
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao salvar banner')
      return
    }

    toast.success(modoEdicao ? 'Banner atualizado!' : 'Banner criado!')
    aoSalvar()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-brand-950">
            {modoEdicao ? 'Editar Banner' : 'Novo Banner'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div>
            <Rotulo htmlFor="titulo">Título *</Rotulo>
            <Entrada
              id="titulo"
              {...register('titulo')}
              erro={errors.titulo?.message}
              placeholder="Promoção de Natal 2026"
            />
          </div>

          <div>
            <Rotulo htmlFor="urlImagem">URL da Imagem *</Rotulo>
            <Entrada
              id="urlImagem"
              {...register('urlImagem')}
              erro={errors.urlImagem?.message}
              placeholder="https://cdn.felipesbakery.com.br/..."
            />
          </div>

          <div>
            <Rotulo htmlFor="urlLink">URL de Destino</Rotulo>
            <Entrada
              id="urlLink"
              {...register('urlLink')}
              erro={errors.urlLink?.message}
              placeholder="/categoria/paes-rusticos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Rotulo htmlFor="ordemExibicao">Ordem</Rotulo>
              <Entrada
                id="ordemExibicao"
                type="number"
                {...register('ordemExibicao')}
              />
            </div>
            <div>
              <Rotulo htmlFor="validoAte">Validade</Rotulo>
              <Entrada
                id="validoAte"
                type="date"
                {...register('validoAte')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modoEdicao ? 'Salvar' : 'Criar Banner'}
            </Botao>
          </div>
        </form>
      </div>
    </div>
  )
}
