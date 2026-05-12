/**
 * FormularioConfiguracoes — Felipe's Bakery Admin
 *
 * Formulário de edição das configurações globais da loja.
 * Client Component (react-hook-form + zod + toast).
 */

'use client'

import { useRouter }   from 'next/navigation'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import { Loader2, Save } from 'lucide-react'
import {
  Botao,
  Cartao,
  CartaoCabecalho,
  CartaoTitulo,
  CartaoConteudo,
  Entrada,
  Rotulo,
} from '@frontend/compartilhado/ui'
import type { ConfiguracoesLoja } from '@backend/modulos/configuracoes/queries'

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]

const schema = z.object({
  nomeLoja:       z.string().min(2, 'Mín. 2 caracteres').max(255),
  whatsapp:       z.string().max(20).optional(),
  telefone:       z.string().max(20).optional(),
  emailContato:   z.string().email('E-mail inválido').or(z.literal('')).optional(),
  diaCorte:       z.coerce.number().int().min(0).max(6),
  horaCorte:      z.coerce.number().int().min(0).max(23),
  diaEntrega:     z.coerce.number().int().min(0).max(6),
  taxaFrete:      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato: 0.00 ou 10.50'),
  modoManutencao: z.coerce.number().int().min(0).max(1),
})

type FormConfig = z.infer<typeof schema>

interface Props {
  config: ConfiguracoesLoja
}

export function FormularioConfiguracoes({ config }: Props) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormConfig>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeLoja:       config.nomeLoja,
      whatsapp:       config.whatsapp     ?? '',
      telefone:       config.telefone     ?? '',
      emailContato:   config.emailContato ?? '',
      diaCorte:       config.diaCorte,
      horaCorte:      config.horaCorte,
      diaEntrega:     config.diaEntrega,
      taxaFrete:      config.taxaFrete,
      modoManutencao: config.modoManutencao as 0 | 1,
    },
  })

  async function onSubmit(dados: FormConfig) {
    const payload = {
      ...dados,
      whatsapp:     dados.whatsapp     || null,
      telefone:     dados.telefone     || null,
      emailContato: dados.emailContato || null,
    }

    const res = await fetch('/api/admin/configuracoes', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.erro ?? 'Erro ao salvar configurações')
      return
    }

    toast.success('Configurações salvas!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Informações da Loja ───────────────────────────── */}
      <Cartao>
        <CartaoCabecalho>
          <CartaoTitulo>Informações da Loja</CartaoTitulo>
        </CartaoCabecalho>
        <CartaoConteudo className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Rotulo htmlFor="nomeLoja">Nome da Loja *</Rotulo>
            <Entrada
              id="nomeLoja"
              {...register('nomeLoja')}
              erro={errors.nomeLoja?.message}
            />
          </div>
          <div>
            <Rotulo htmlFor="whatsapp">WhatsApp</Rotulo>
            <Entrada
              id="whatsapp"
              {...register('whatsapp')}
              placeholder="5516997684430"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Com país + DDD, sem espaços. Ex: 5516997684430
            </p>
          </div>
          <div>
            <Rotulo htmlFor="telefone">Telefone</Rotulo>
            <Entrada
              id="telefone"
              {...register('telefone')}
              placeholder="(16) 99768-4430"
            />
          </div>
          <div className="sm:col-span-2">
            <Rotulo htmlFor="emailContato">E-mail de Contato</Rotulo>
            <Entrada
              id="emailContato"
              type="email"
              {...register('emailContato')}
              erro={errors.emailContato?.message}
              placeholder="contato@felipesbakery.com.br"
            />
          </div>
        </CartaoConteudo>
      </Cartao>

      {/* ── Ciclo de Pedidos ─────────────────────────────── */}
      <Cartao>
        <CartaoCabecalho>
          <CartaoTitulo>Ciclo de Pedidos</CartaoTitulo>
        </CartaoCabecalho>
        <CartaoConteudo className="grid gap-4 sm:grid-cols-3">
          <div>
            <Rotulo htmlFor="diaCorte">Dia de Corte</Rotulo>
            <select
              id="diaCorte"
              {...register('diaCorte')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DIAS_SEMANA.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <Rotulo htmlFor="horaCorte">Hora de Corte</Rotulo>
            <select
              id="horaCorte"
              {...register('horaCorte')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <Rotulo htmlFor="diaEntrega">Dia de Entrega</Rotulo>
            <select
              id="diaEntrega"
              {...register('diaEntrega')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DIAS_SEMANA.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
        </CartaoConteudo>
      </Cartao>

      {/* ── Entrega e Manutenção ─────────────────────────── */}
      <Cartao>
        <CartaoCabecalho>
          <CartaoTitulo>Entrega e Manutenção</CartaoTitulo>
        </CartaoCabecalho>
        <CartaoConteudo className="grid gap-4 sm:grid-cols-2">
          <div>
            <Rotulo htmlFor="taxaFrete">Taxa de Frete (R$)</Rotulo>
            <Entrada
              id="taxaFrete"
              {...register('taxaFrete')}
              erro={errors.taxaFrete?.message}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use 0.00 para frete grátis
            </p>
          </div>
          <div>
            <Rotulo htmlFor="modoManutencao">Status do Site</Rotulo>
            <select
              id="modoManutencao"
              {...register('modoManutencao')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Operacional (público)</option>
              <option value={1}>Em manutenção (oculto)</option>
            </select>
          </div>
        </CartaoConteudo>
      </Cartao>

      {/* ── Ações ──────────────────────────────────────────── */}
      <div className="flex justify-end gap-2 sticky bottom-0 bg-cream-100/95 backdrop-blur py-3 -mx-1 px-1 border-t border-stone-200">
        <Botao type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Save     className="mr-2 h-4 w-4" />}
          Salvar Configurações
        </Botao>
      </div>
    </form>
  )
}
