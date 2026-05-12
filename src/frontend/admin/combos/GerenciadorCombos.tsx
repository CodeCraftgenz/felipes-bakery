/**
 * GerenciadorCombos — Felipe's Bakery Admin
 *
 * Lista, cria, ativa/desativa e remove combos sazonais.
 * Quando ativos + dentro da validade, os combos aparecem no destaque da home.
 */

'use client'

import { useState, useMemo }     from 'react'
import { useRouter }             from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver }           from '@hookform/resolvers/zod'
import { z }                     from 'zod'
import { toast }                 from 'sonner'
import {
  Loader2, Plus, Trash2, Power, Pencil, X, Gift,
} from 'lucide-react'
import { Botao, Entrada, Rotulo, Cracha } from '@frontend/compartilhado/ui'
import { CampoImagemUpload }     from '@frontend/admin/compartilhado/CampoImagemUpload'
import type { ComboCompleto }    from '@backend/modulos/combos/queries'

// ── Tipo mínimo de produto para o seletor ────────────────────
export interface ProdutoOpcao {
  id:    number
  nome:  string
  preco: string
}

// ── Schema do formulário ─────────────────────────────────────
const schemaItem = z.object({
  produtoId:  z.coerce.number().int().positive('Selecione um produto'),
  quantidade: z.coerce.number().int().positive('Mínimo 1'),
})

const schemaCombo = z.object({
  slug:          z.string().min(2, 'Mín. 2 caracteres'),
  nome:          z.string().min(2, 'Mín. 2 caracteres'),
  descricao:     z.string().optional(),
  preco:         z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato: 0.00'),
  precoOriginal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato: 0.00').optional().or(z.literal('')),
  urlImagem:     z.string().url('URL inválida').optional().or(z.literal('')),
  tema:          z.enum(['natal', 'pascoa', 'mae', 'pai', 'namorados', 'geral']),
  destacarHome:  z.coerce.number().int().min(0).max(1),
  ativo:         z.coerce.number().int().min(0).max(1),
  validoDesde:   z.string().optional(),
  validoAte:     z.string().optional(),
  itens:         z.array(schemaItem).min(1, 'Adicione ao menos 1 produto'),
})

type FormCombo = z.infer<typeof schemaCombo>

interface Props {
  combosIniciais: ComboCompleto[]
  produtos:       ProdutoOpcao[]
}

export function GerenciadorCombos({ combosIniciais, produtos }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState<ComboCompleto | null>(null)

  function abrirCriacao() {
    setEditando(null)
    setAberto(true)
  }

  function abrirEdicao(c: ComboCompleto) {
    setEditando(c)
    setAberto(true)
  }

  async function alternarAtivo(id: number) {
    const res = await fetch(`/api/admin/combos/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ alternarAtivo: true }),
    })
    if (!res.ok) return toast.error('Erro ao alternar status')
    toast.success('Status atualizado')
    router.refresh()
  }

  async function deletar(id: number, nome: string) {
    if (!confirm(`Remover o combo "${nome}"?`)) return
    const res = await fetch(`/api/admin/combos/${id}`, { method: 'DELETE' })
    if (!res.ok) return toast.error('Erro ao remover combo')
    toast.success('Combo removido')
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <Botao onClick={abrirCriacao}>
          <Plus className="mr-1 h-4 w-4" /> Novo Combo
        </Botao>
      </div>

      {/* Lista de combos */}
      {combosIniciais.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-stone-300 bg-white py-16 text-center">
          <Gift className="h-12 w-12 text-stone-300" />
          <div>
            <p className="font-medium text-stone-700">Nenhum combo cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Crie um combo para datas especiais (Natal, Páscoa, etc.)
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {combosIniciais.map((c) => (
            <CartaoCombo
              key={c.id}
              combo={c}
              aoEditar={() => abrirEdicao(c)}
              aoAlternar={() => alternarAtivo(c.id)}
              aoDeletar={() => deletar(c.id, c.nome)}
            />
          ))}
        </div>
      )}

      {aberto && (
        <ModalCombo
          combo={editando}
          produtos={produtos}
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

// ── Card de combo ───────────────────────────────────────────
function CartaoCombo({
  combo,
  aoEditar,
  aoAlternar,
  aoDeletar,
}: {
  combo:      ComboCompleto
  aoEditar:   () => void
  aoAlternar: () => void
  aoDeletar:  () => void
}) {
  const formatarMoeda = (v: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      {/* Faixa colorida pelo tema */}
      <div className={`h-2 ${corPorTema(combo.tema)}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-serif text-lg font-semibold text-stone-900">{combo.nome}</h3>
            <p className="font-mono text-xs text-muted-foreground">/{combo.slug}</p>
          </div>
          <Cracha variante={combo.ativo ? 'padrao' : 'secundario'}>
            {combo.ativo ? 'Ativo' : 'Inativo'}
          </Cracha>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-stone-900">{formatarMoeda(combo.preco)}</span>
          {combo.precoOriginal && (
            <span className="text-sm text-stone-400 line-through">
              {formatarMoeda(combo.precoOriginal)}
            </span>
          )}
        </div>

        <ul className="text-xs text-muted-foreground space-y-0.5">
          {combo.itens.slice(0, 3).map((i) => (
            <li key={i.produtoId}>• {i.quantidade}× {i.nome}</li>
          ))}
          {combo.itens.length > 3 && <li>+ {combo.itens.length - 3} produto(s)</li>}
        </ul>

        {(combo.validoDesde || combo.validoAte) && (
          <p className="text-xs text-muted-foreground">
            Validade:{' '}
            {combo.validoDesde && new Date(combo.validoDesde).toLocaleDateString('pt-BR')}
            {' → '}
            {combo.validoAte ? new Date(combo.validoAte).toLocaleDateString('pt-BR') : 'sem vencimento'}
          </p>
        )}

        <div className="flex items-center justify-end gap-1 border-t pt-3 -mx-1 px-1">
          <button
            onClick={aoEditar}
            className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={aoAlternar}
            className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
            title={combo.ativo ? 'Desativar' : 'Ativar'}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={aoDeletar}
            className="rounded p-1.5 text-red-500 hover:bg-red-50"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function corPorTema(tema: string): string {
  const mapa: Record<string, string> = {
    natal:     'bg-gradient-to-r from-red-500 to-emerald-600',
    pascoa:    'bg-gradient-to-r from-amber-400 to-pink-400',
    mae:       'bg-gradient-to-r from-pink-400 to-rose-400',
    pai:       'bg-gradient-to-r from-blue-500 to-indigo-500',
    namorados: 'bg-gradient-to-r from-rose-500 to-pink-500',
    geral:     'bg-gradient-to-r from-brand-400 to-brand-600',
  }
  return mapa[tema] ?? mapa.geral
}

// ── Modal de criação/edição ──────────────────────────────────
function ModalCombo({
  combo,
  produtos,
  aoFechar,
  aoSalvar,
}: {
  combo:    ComboCompleto | null
  produtos: ProdutoOpcao[]
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const modoEdicao = !!combo

  const valoresIniciais: FormCombo = useMemo(() => {
    if (combo) {
      return {
        slug:          combo.slug,
        nome:          combo.nome,
        descricao:     combo.descricao ?? '',
        preco:         combo.preco,
        precoOriginal: combo.precoOriginal ?? '',
        urlImagem:     combo.urlImagem ?? '',
        tema:          combo.tema as FormCombo['tema'],
        destacarHome:  combo.destacarHome as 0 | 1,
        ativo:         combo.ativo as 0 | 1,
        validoDesde:   combo.validoDesde
          ? new Date(combo.validoDesde).toISOString().slice(0, 10)
          : '',
        validoAte:     combo.validoAte
          ? new Date(combo.validoAte).toISOString().slice(0, 10)
          : '',
        itens:         combo.itens.map((i) => ({
          produtoId:  i.produtoId,
          quantidade: i.quantidade,
        })),
      }
    }
    return {
      slug:          '',
      nome:          '',
      descricao:     '',
      preco:         '',
      precoOriginal: '',
      urlImagem:     '',
      tema:          'geral',
      destacarHome:  1,
      ativo:         1,
      validoDesde:   '',
      validoAte:     '',
      itens:         [{ produtoId: produtos[0]?.id ?? 0, quantidade: 1 }],
    }
  }, [combo, produtos])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormCombo>({
    resolver:      zodResolver(schemaCombo),
    defaultValues: valoresIniciais,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  async function onSubmit(dados: FormCombo) {
    const payload = {
      ...dados,
      descricao:     dados.descricao     || null,
      precoOriginal: dados.precoOriginal || null,
      urlImagem:     dados.urlImagem     || null,
      validoDesde:   dados.validoDesde   ? new Date(dados.validoDesde).toISOString() : null,
      validoAte:     dados.validoAte     ? new Date(dados.validoAte).toISOString()   : null,
    }

    const url    = modoEdicao ? `/api/admin/combos/${combo!.id}` : '/api/admin/combos'
    const method = modoEdicao ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao salvar combo')
      return
    }
    toast.success(modoEdicao ? 'Combo atualizado!' : 'Combo criado!')
    aoSalvar()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={aoFechar}
    >
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixo no topo */}
        <div className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-serif text-lg font-semibold text-brand-950">
            {modoEdicao ? 'Editar Combo' : 'Novo Combo'}
          </h2>
          <button onClick={aoFechar} aria-label="Fechar" className="rounded p-1 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form: body com scroll + footer fixo */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="nome">Nome *</Rotulo>
                <Entrada id="nome" {...register('nome')} erro={errors.nome?.message} placeholder="Cesta de Natal" />
              </div>
              <div>
                <Rotulo htmlFor="slug">Slug *</Rotulo>
                <Entrada
                  id="slug"
                  {...register('slug')}
                  erro={errors.slug?.message}
                  placeholder="cesta-natal-2026"
                  className="font-mono lowercase"
                />
              </div>
            </div>

          <div>
            <Rotulo htmlFor="descricao">Descrição</Rotulo>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={3}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Edição limitada para o Natal..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Rotulo htmlFor="preco">Preço Combo *</Rotulo>
              <Entrada id="preco" {...register('preco')} erro={errors.preco?.message} placeholder="89.90" />
            </div>
            <div>
              <Rotulo htmlFor="precoOriginal">Preço Cheio</Rotulo>
              <Entrada id="precoOriginal" {...register('precoOriginal')} placeholder="120.00" />
              <p className="mt-1 text-xs text-muted-foreground">Para mostrar a economia</p>
            </div>
            <div>
              <Rotulo htmlFor="tema">Tema *</Rotulo>
              <select
                id="tema"
                {...register('tema')}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="natal">Natal</option>
                <option value="pascoa">Páscoa</option>
                <option value="mae">Dia das Mães</option>
                <option value="pai">Dia dos Pais</option>
                <option value="namorados">Namorados</option>
                <option value="geral">Geral</option>
              </select>
            </div>
          </div>

          <Controller
            control={control}
            name="urlImagem"
            render={({ field }) => (
              <CampoImagemUpload
                id="urlImagem"
                label="Imagem do Combo"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="validoDesde">Válido desde</Rotulo>
              <Entrada id="validoDesde" type="date" {...register('validoDesde')} />
            </div>
            <div>
              <Rotulo htmlFor="validoAte">Válido até</Rotulo>
              <Entrada id="validoAte" type="date" {...register('validoAte')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="destacarHome">Destacar na Home</Rotulo>
              <select
                id="destacarHome"
                {...register('destacarHome')}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={1}>Sim — aparece em destaque</option>
                <option value={0}>Não — só via link direto</option>
              </select>
            </div>
            <div>
              <Rotulo htmlFor="ativo">Status</Rotulo>
              <select
                id="ativo"
                {...register('ativo')}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>

          {/* Itens do combo */}
          <div className="space-y-2 rounded-lg border border-stone-200 p-4">
            <div className="flex items-center justify-between">
              <Rotulo>Produtos do Combo *</Rotulo>
              <button
                type="button"
                onClick={() => append({ produtoId: produtos[0]?.id ?? 0, quantidade: 1 })}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3 w-3" /> Adicionar produto
              </button>
            </div>

            {fields.map((f, idx) => (
              <div key={f.id} className="flex items-end gap-2">
                <div className="flex-1">
                  {idx === 0 && <p className="mb-1 text-xs text-muted-foreground">Produto</p>}
                  <select
                    {...register(`itens.${idx}.produtoId`)}
                    aria-label={`Produto ${idx + 1}`}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  {idx === 0 && <p className="mb-1 text-xs text-muted-foreground">Qtd.</p>}
                  <Entrada
                    type="number"
                    min={1}
                    aria-label={`Quantidade do produto ${idx + 1}`}
                    {...register(`itens.${idx}.quantidade`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  disabled={fields.length === 1}
                  className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                  aria-label="Remover este produto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {errors.itens && (
              <p className="text-xs text-red-500">
                {(errors.itens.root?.message ?? errors.itens.message) || 'Adicione ao menos 1 produto'}
              </p>
            )}
          </div>
          </div>
          {/* Footer — fixo no rodapé do modal (fora do scroll) */}
          <div className="flex shrink-0 justify-end gap-2 border-t bg-white px-4 py-3 sm:px-6 sm:py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modoEdicao ? 'Salvar' : 'Criar Combo'}
            </Botao>
          </div>
        </form>
      </div>
    </div>
  )
}
