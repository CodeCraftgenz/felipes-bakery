/**
 * Etapa de Dados Pessoais e Endereço — Checkout
 *
 * Primeiro passo do checkout:
 *   - Nome completo, e-mail, CPF, telefone
 *   - Endereço de entrega (com busca automática por CEP via ViaCEP)
 *
 * Client Component com react-hook-form + Zod.
 */

'use client'

import React                  from 'react'
import { useForm }            from 'react-hook-form'
import { zodResolver }        from '@hookform/resolvers/zod'
import { z }                  from 'zod'
import { Loader2, Search }    from 'lucide-react'
import { Botao }              from '@frontend/compartilhado/ui/botao'
import { Entrada }            from '@frontend/compartilhado/ui/entrada'
import { Rotulo }             from '@frontend/compartilhado/ui/rotulo'
import { Separador }          from '@frontend/compartilhado/ui/separador'
import {
  schemaEndereco,
  schemaDadosPagador,
  limparCPF,
  limparCEP,
} from '@compartilhado/validacoes/pedido'

// ── Schema do formulário desta etapa ─────────────────────────
const schemaEtapaDados = schemaDadosPagador.merge(schemaEndereco)
export type DadosEtapa = z.infer<typeof schemaEtapaDados>

// ── Props ─────────────────────────────────────────────────────
interface PropsEtapaDados {
  dadosIniciais?: Partial<DadosEtapa>
  aoAvancar: (dados: DadosEtapa) => void
}

// ── Componente ────────────────────────────────────────────────
export function EtapaDados({ dadosIniciais, aoAvancar }: PropsEtapaDados) {
  const [buscandoCep, setBuscandoCep] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DadosEtapa>({
    resolver:      zodResolver(schemaEtapaDados),
    defaultValues: dadosIniciais,
  })

  // ── Busca de CEP via ViaCEP ──────────────────────────────────
  const aoBlurCep = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = limparCEP(e.target.value)
    if (cep.length !== 8) return

    setBuscandoCep(true)
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const dados    = await resposta.json()

      if (!dados.erro) {
        setValue('logradouro', dados.logradouro, { shouldValidate: true })
        setValue('bairro',     dados.bairro,     { shouldValidate: true })
        setValue('cidade',     dados.localidade, { shouldValidate: true })
        setValue('estado',     dados.uf,         { shouldValidate: true })
      }
    } catch {
      // Falha silenciosa — usuário preenche manualmente
    } finally {
      setBuscandoCep(false)
    }
  }

  // Formata CPF enquanto digita (xxx.xxx.xxx-xx)
  const aoDigitarCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apenasNumeros = limparCPF(e.target.value).slice(0, 11)
    const formatado = apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
    e.target.value = formatado
  }

  return (
    <form onSubmit={handleSubmit(aoAvancar)} className="space-y-8">

      {/* ── Dados Pessoais ──────────────────────────────────── */}
      <section>
        <h2 className="font-playfair text-xl font-semibold text-stone-900 mb-5">
          Dados Pessoais
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Nome completo */}
          <div className="sm:col-span-2 space-y-1.5">
            <Rotulo htmlFor="nome">Nome completo *</Rotulo>
            <Entrada
              id="nome"
              placeholder="Felipe da Silva"
              erro={errors.nome?.message}
              {...register('nome')}
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Rotulo htmlFor="email">E-mail *</Rotulo>
            <Entrada
              id="email"
              type="email"
              placeholder="felipe@email.com"
              erro={errors.email?.message}
              {...register('email')}
            />
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <Rotulo htmlFor="cpf">CPF *</Rotulo>
            <Entrada
              id="cpf"
              placeholder="000.000.000-00"
              maxLength={14}
              erro={errors.cpf?.message}
              {...register('cpf', {
                onChange: aoDigitarCpf,
                setValueAs: limparCPF,
              })}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Rotulo htmlFor="telefone">Telefone / WhatsApp</Rotulo>
            <Entrada
              id="telefone"
              placeholder="(16) 99999-9999"
              erro={errors.telefone?.message}
              {...register('telefone', { setValueAs: (v) => v?.replace(/\D/g, '') || undefined })}
            />
          </div>

        </div>
      </section>

      <Separador />

      {/* ── Endereço de Entrega ──────────────────────────────── */}
      <section>
        <h2 className="font-playfair text-xl font-semibold text-stone-900 mb-5">
          Endereço de Entrega
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">

          {/* CEP */}
          <div className="sm:col-span-2 space-y-1.5">
            <Rotulo htmlFor="cep">CEP *</Rotulo>
            <Entrada
              id="cep"
              placeholder="00000-000"
              maxLength={9}
              erro={errors.cep?.message}
              iconeDireita={buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {...register('cep', {
                onBlur: aoBlurCep,
                setValueAs: limparCEP,
              })}
            />
          </div>

          {/* Logradouro */}
          <div className="sm:col-span-4 space-y-1.5">
            <Rotulo htmlFor="logradouro">Logradouro *</Rotulo>
            <Entrada
              id="logradouro"
              placeholder="Rua, Avenida..."
              erro={errors.logradouro?.message}
              {...register('logradouro')}
            />
          </div>

          {/* Número */}
          <div className="sm:col-span-2 space-y-1.5">
            <Rotulo htmlFor="numero">Número *</Rotulo>
            <Entrada
              id="numero"
              placeholder="123"
              erro={errors.numero?.message}
              {...register('numero')}
            />
          </div>

          {/* Complemento */}
          <div className="sm:col-span-4 space-y-1.5">
            <Rotulo htmlFor="complemento">Complemento</Rotulo>
            <Entrada
              id="complemento"
              placeholder="Apto 42, Bloco B..."
              {...register('complemento')}
            />
          </div>

          {/* Bairro */}
          <div className="sm:col-span-2 space-y-1.5">
            <Rotulo htmlFor="bairro">Bairro *</Rotulo>
            <Entrada
              id="bairro"
              placeholder="Centro"
              erro={errors.bairro?.message}
              {...register('bairro')}
            />
          </div>

          {/* Cidade */}
          <div className="sm:col-span-3 space-y-1.5">
            <Rotulo htmlFor="cidade">Cidade *</Rotulo>
            <Entrada
              id="cidade"
              placeholder="Ribeirão Preto"
              erro={errors.cidade?.message}
              {...register('cidade')}
            />
          </div>

          {/* Estado */}
          <div className="sm:col-span-1 space-y-1.5">
            <Rotulo htmlFor="estado">UF *</Rotulo>
            <Entrada
              id="estado"
              placeholder="SP"
              maxLength={2}
              className="uppercase"
              erro={errors.estado?.message}
              {...register('estado', { setValueAs: (v) => v?.toUpperCase() })}
            />
          </div>

        </div>
      </section>

      {/* Botão avançar */}
      <div className="flex justify-end pt-2">
        <Botao type="submit" tamanho="g" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</>
          ) : (
            'Continuar para Pagamento →'
          )}
        </Botao>
      </div>

    </form>
  )
}
