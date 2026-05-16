/**
 * GerenciadorCupons — Felipe's Bakery Admin
 *
 * Client Component que lista, cria, edita, ativa/desativa e remove cupons.
 * Usa fetch direto contra /api/admin/cupons.
 */

'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { useForm }        from 'react-hook-form'
import { zodResolver }    from '@hookform/resolvers/zod'
import { z }              from 'zod'
import { toast }          from 'sonner'
import { Loader2, Plus, Trash2, Power, Pencil, Copy, Package } from 'lucide-react'
import {
  Botao, Entrada, Rotulo, Cracha,
} from '@frontend/compartilhado/ui'
import type { Cupom } from '@schema'

// ── Schema do formulário ──────────────────────────────────────
const schemaCupom = z.object({
  codigo:            z.string().min(2, 'Código obrigatório (mín. 2 caracteres)'),
  descricao:         z.string().optional(),
  tipo:              z.enum(['percentual', 'fixo']),
  valor:             z.string().min(1, 'Valor obrigatório'),
  valorMinimoPedido: z.string().optional(),
  maxDesconto:       z.string().optional(),
  maxUsos:           z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  maxUsosPorCliente: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? 1 : v),
    z.coerce.number().int().positive().default(1),
  ),
  validoAte:         z.string().optional(),
})

type FormCupom = z.infer<typeof schemaCupom>

interface Props {
  cuponsIniciais: Cupom[]
}

// ── Componente ────────────────────────────────────────────────
export function GerenciadorCupons({ cuponsIniciais }: Props) {
  const router = useRouter()
  const [aberto, setAberto]   = useState(false)
  const [loteAberto, setLoteAberto] = useState(false)
  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null)

  function abrirCriacao() {
    setCupomEditando(null)
    setAberto(true)
  }

  function abrirEdicao(c: Cupom) {
    setCupomEditando(c)
    setAberto(true)
  }

  async function alternarAtivo(id: number) {
    const res = await fetch(`/api/admin/cupons/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ alternarAtivo: true }),
    })
    if (!res.ok) {
      toast.error('Erro ao alternar status')
      return
    }
    toast.success('Status atualizado')
    router.refresh()
  }

  async function deletar(id: number) {
    if (!confirm('Tem certeza que deseja remover este cupom?')) return
    const res = await fetch(`/api/admin/cupons/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erro ao remover cupom')
      return
    }
    toast.success('Cupom removido')
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Botao variante="contorno" onClick={() => setLoteAberto(true)}>
          <Package className="mr-1 h-4 w-4" /> Gerar Lote
        </Botao>
        <Botao onClick={abrirCriacao}>
          <Plus className="mr-1 h-4 w-4" /> Novo Cupom
        </Botao>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Desconto</th>
              <th className="px-4 py-3 text-right">Pedido Mín.</th>
              <th className="px-4 py-3 text-center">Usos</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cuponsIniciais.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
            {cuponsIniciais.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-mono text-sm font-semibold">{c.codigo}</td>
                <td className="px-4 py-3 capitalize">{c.tipo}</td>
                <td className="px-4 py-3 text-right">
                  {c.tipo === 'percentual' ? `${parseFloat(c.valor)}%` : `R$ ${parseFloat(c.valor).toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-right">
                  {c.valorMinimoPedido ? `R$ ${parseFloat(c.valorMinimoPedido).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.usosAtuais}{c.maxUsos ? ` / ${c.maxUsos}` : ''}
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.validoAte ? new Date(c.validoAte).toLocaleDateString('pt-BR') : 'Sem vencimento'}
                </td>
                <td className="px-4 py-3 text-center">
                  <Cracha variante={c.ativo ? 'padrao' : 'secundario'}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </Cracha>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => abrirEdicao(c)}
                      title="Editar"
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alternarAtivo(c.id)}
                      title={c.ativo ? 'Desativar' : 'Ativar'}
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletar(c.id)}
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

      {/* Modal/drawer com formulário */}
      {aberto && (
        <ModalCupom
          cupom={cupomEditando}
          aoFechar={() => setAberto(false)}
          aoSalvar={() => {
            setAberto(false)
            router.refresh()
          }}
        />
      )}

      {loteAberto && (
        <ModalLoteCupons
          aoFechar={() => setLoteAberto(false)}
          aoConcluir={() => {
            setLoteAberto(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

// ── Modal de criação/edição ──────────────────────────────────
function ModalCupom({
  cupom,
  aoFechar,
  aoSalvar,
}: {
  cupom: Cupom | null
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const modoEdicao = !!cupom

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormCupom>({
    resolver: zodResolver(schemaCupom),
    defaultValues: cupom
      ? {
          codigo:            cupom.codigo,
          descricao:         cupom.descricao ?? '',
          tipo:              cupom.tipo as 'percentual' | 'fixo',
          valor:             cupom.valor,
          valorMinimoPedido: cupom.valorMinimoPedido ?? '',
          maxDesconto:       cupom.maxDesconto ?? '',
          maxUsos:           cupom.maxUsos ?? undefined,
          maxUsosPorCliente: cupom.maxUsosPorCliente,
          validoAte:         cupom.validoAte
            ? new Date(cupom.validoAte).toISOString().slice(0, 10)
            : '',
        }
      : { tipo: 'percentual', maxUsosPorCliente: 1 },
  })

  async function onSubmit(dados: FormCupom) {
    const url    = modoEdicao ? `/api/admin/cupons/${cupom!.id}` : '/api/admin/cupons'
    const method = modoEdicao ? 'PATCH' : 'POST'

    // Normaliza campos vazios para null/undefined antes de enviar
    const payload: Record<string, unknown> = {
      codigo:             dados.codigo,
      descricao:          dados.descricao || null,
      tipo:               dados.tipo,
      valor:              dados.valor,
      valorMinimoPedido:  dados.valorMinimoPedido || null,
      maxDesconto:        dados.maxDesconto || null,
      maxUsos:            dados.maxUsos ?? null,
      maxUsosPorCliente:  dados.maxUsosPorCliente,
      validoAte:          dados.validoAte ? new Date(dados.validoAte).toISOString() : null,
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao salvar cupom')
      return
    }

    toast.success(modoEdicao ? 'Cupom atualizado!' : 'Cupom criado!')
    aoSalvar()
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
      onClick={aoFechar}
    >
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl sm:my-8 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 sm:px-6 sm:py-4 sm:rounded-t-lg">
          <h2 className="font-serif text-lg font-semibold text-brand-950">
            {modoEdicao ? 'Editar Cupom' : 'Novo Cupom'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 sm:p-6">
          <div>
            <Rotulo htmlFor="codigo">Código *</Rotulo>
            <Entrada
              id="codigo"
              {...register('codigo')}
              erro={errors.codigo?.message}
              placeholder="EX: BEMVINDO10"
              className="font-mono uppercase"
            />
          </div>

          <div>
            <Rotulo htmlFor="descricao">Descrição</Rotulo>
            <Entrada
              id="descricao"
              {...register('descricao')}
              placeholder="Visível apenas no admin"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="tipo">Tipo *</Rotulo>
              <select
                id="tipo"
                {...register('tipo')}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Fixo (R$)</option>
              </select>
            </div>
            <div>
              <Rotulo htmlFor="valor">Valor *</Rotulo>
              <Entrada
                id="valor"
                {...register('valor')}
                erro={errors.valor?.message}
                placeholder="10 ou 5.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="valorMinimoPedido">Pedido Mínimo (R$)</Rotulo>
              <Entrada
                id="valorMinimoPedido"
                {...register('valorMinimoPedido')}
                placeholder="0.00"
              />
            </div>
            <div>
              <Rotulo htmlFor="maxDesconto">Desconto Máximo (R$)</Rotulo>
              <Entrada
                id="maxDesconto"
                {...register('maxDesconto')}
                placeholder="Apenas para %"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="maxUsos">Limite Total de Usos</Rotulo>
              <Entrada
                id="maxUsos"
                type="number"
                {...register('maxUsos')}
                placeholder="Ilimitado"
              />
            </div>
            <div>
              <Rotulo htmlFor="maxUsosPorCliente">Usos por Cliente</Rotulo>
              <Entrada
                id="maxUsosPorCliente"
                type="number"
                {...register('maxUsosPorCliente')}
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <Rotulo htmlFor="validoAte">Validade</Rotulo>
            <Entrada
              id="validoAte"
              type="date"
              {...register('validoAte')}
            />
          </div>

          <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t bg-white px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modoEdicao ? 'Salvar' : 'Criar Cupom'}
            </Botao>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

// ── Modal de geração em lote ─────────────────────────────────
const schemaLote = z.object({
  prefixo:           z.string().min(2, 'Mín. 2 caracteres').max(20, 'Máx. 20'),
  quantidade:        z.coerce.number().int().min(1, 'Mín. 1').max(500, 'Máx. 500'),
  tipo:              z.enum(['percentual', 'fixo']),
  valor:             z.string().min(1, 'Valor obrigatório'),
  valorMinimoPedido: z.string().optional(),
  maxDesconto:       z.string().optional(),
  validoAte:         z.string().optional(),
})

type FormLote = z.infer<typeof schemaLote>

function ModalLoteCupons({
  aoFechar,
  aoConcluir,
}: {
  aoFechar:   () => void
  aoConcluir: () => void
}) {
  const [codigosGerados, setCodigosGerados] = useState<string[] | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLote>({
    resolver:      zodResolver(schemaLote),
    defaultValues: { tipo: 'percentual', prefixo: 'PROMO', quantidade: 50 },
  })

  async function onSubmit(dados: FormLote) {
    const payload = {
      ...dados,
      valorMinimoPedido: dados.valorMinimoPedido || null,
      maxDesconto:       dados.maxDesconto       || null,
      validoAte:         dados.validoAte ? new Date(dados.validoAte).toISOString() : null,
    }

    const res = await fetch('/api/admin/cupons/lote', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao gerar lote')
      return
    }
    const json = await res.json()
    setCodigosGerados(json.codigos)
    toast.success(`${json.total} cupons gerados!`)
  }

  function copiarCodigos() {
    if (!codigosGerados) return
    navigator.clipboard.writeText(codigosGerados.join('\n'))
    toast.success('Códigos copiados para a área de transferência!')
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
      onClick={aoFechar}
    >
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl sm:my-8 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 sm:px-6 sm:py-4 sm:rounded-t-lg">
          <h2 className="font-serif text-lg font-semibold text-brand-950">
            Gerar Cupons em Lote
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cria N códigos únicos para campanhas (cada código vale 1 uso).
          </p>
        </div>

        {codigosGerados ? (
          // ── Resultado: lista de códigos ─────────────────────
          <div className="space-y-4 p-4 sm:p-6">
            <p className="text-sm text-stone-700">
              <strong>{codigosGerados.length}</strong> cupons criados.
              Copie a lista para distribuir entre os clientes:
            </p>
            <textarea
              readOnly
              aria-label="Códigos de cupom gerados"
              value={codigosGerados.join('\n')}
              className="block h-48 w-full resize-none rounded-md border border-input bg-stone-50 px-3 py-2 font-mono text-xs"
            />
            <div className="flex justify-end gap-2 border-t pt-4">
              <Botao variante="contorno" onClick={copiarCodigos}>
                <Copy className="mr-1 h-4 w-4" /> Copiar todos
              </Botao>
              <Botao onClick={aoConcluir}>Fechar</Botao>
            </div>
          </div>
        ) : (
          // ── Formulário ──────────────────────────────────────
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="prefixo">Prefixo *</Rotulo>
                <Entrada
                  id="prefixo"
                  {...register('prefixo')}
                  erro={errors.prefixo?.message}
                  placeholder="NATAL"
                  className="font-mono uppercase"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Códigos viram: PREFIXO-XXXXXX
                </p>
              </div>
              <div>
                <Rotulo htmlFor="quantidade">Quantidade *</Rotulo>
                <Entrada
                  id="quantidade"
                  type="number"
                  min={1}
                  max={500}
                  {...register('quantidade')}
                  erro={errors.quantidade?.message}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Até 500 cupons por lote
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="lote-tipo">Tipo *</Rotulo>
                <select
                  id="lote-tipo"
                  {...register('tipo')}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="fixo">Fixo (R$)</option>
                </select>
              </div>
              <div>
                <Rotulo htmlFor="lote-valor">Valor *</Rotulo>
                <Entrada
                  id="lote-valor"
                  {...register('valor')}
                  erro={errors.valor?.message}
                  placeholder="10 ou 5.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="lote-min">Pedido Mín. (R$)</Rotulo>
                <Entrada id="lote-min" {...register('valorMinimoPedido')} placeholder="0.00" />
              </div>
              <div>
                <Rotulo htmlFor="lote-max">Desc. Máx. (R$)</Rotulo>
                <Entrada id="lote-max" {...register('maxDesconto')} placeholder="apenas %" />
              </div>
            </div>

            <div>
              <Rotulo htmlFor="lote-validade">Validade</Rotulo>
              <Entrada id="lote-validade" type="date" {...register('validoAte')} />
            </div>

            <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t bg-white px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-4">
              <Botao type="button" variante="contorno" onClick={aoFechar}>
                Cancelar
              </Botao>
              <Botao type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Lote
              </Botao>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  )
}
