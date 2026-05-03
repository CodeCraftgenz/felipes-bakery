/**
 * Página de Checkout — Felipe's Bakery
 *
 * Fluxo de 2 etapas:
 *   1. Dados pessoais + endereço de entrega
 *   2. QR code Pix + aguardar confirmação
 *
 * A transição entre etapas acontece no cliente.
 * A criação do pedido e do Pix é feita na passagem para a etapa 2.
 *
 * Client Component — lê o carrinho do Zustand.
 */

'use client'

import React              from 'react'
import Link               from 'next/link'
import { useRouter }      from 'next/navigation'
import { toast }          from 'sonner'
import { Loader2 }        from 'lucide-react'
import { EtapaDados, type DadosEtapa } from '@frontend/publico/checkout/EtapaDados'
import { EtapaPix }       from '@frontend/publico/checkout/EtapaPix'
import { ResumoCheckout } from '@frontend/publico/checkout/ResumoCheckout'
import { useCarrinho }    from '@frontend/compartilhado/stores/carrinho'

// ── Tipos do resultado da API ao criar o pedido ───────────────
interface RespostaPedido {
  numeroPedido:  string
  valorTotal:    number
  qrCodeBase64:  string
  qrCodeTexto:   string
  expiracaoEm:   string
}

// ── Indicador de progresso ────────────────────────────────────
function IndicadorEtapas({ etapaAtual }: { etapaAtual: 1 | 2 }) {
  const etapas = ['Seus Dados', 'Pagamento Pix']
  return (
    <div className="flex items-center gap-2 mb-8">
      {etapas.map((nome, i) => {
        const num   = i + 1
        const ativo = num === etapaAtual
        const feito = num < etapaAtual
        return (
          <React.Fragment key={num}>
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                feito  ? 'bg-green-500 text-white' :
                ativo  ? 'bg-brand-500 text-white' :
                         'bg-stone-200 text-stone-500'
              }`}>
                {feito ? '✓' : num}
              </div>
              <span className={`text-sm font-medium ${ativo ? 'text-stone-900' : 'text-stone-400'}`}>
                {nome}
              </span>
            </div>
            {i < etapas.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${feito ? 'bg-green-400' : 'bg-stone-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────
export default function PaginaCheckout() {
  const router       = useRouter()
  const itens        = useCarrinho((s) => s.itens)
  const total        = useCarrinho((s) => s.total())
  const cupom        = useCarrinho((s) => s.cupom)
  const limparCarrinho = useCarrinho((s) => s.limparCarrinho)

  const [etapa, setEtapa]           = React.useState<1 | 2>(1)
  const [dadosForm, setDadosForm]   = React.useState<DadosEtapa | null>(null)
  const [criandoPedido, setCriando] = React.useState(false)
  const [dadosPix, setDadosPix]     = React.useState<RespostaPedido | null>(null)

  // Redireciona para o carrinho se estiver vazio
  React.useEffect(() => {
    if (itens.length === 0 && !dadosPix) {
      router.replace('/carrinho')
    }
  }, [itens, dadosPix, router])

  // ── Ao avançar da Etapa 1 para Etapa 2 ──────────────────────
  const aoAvancarParaPix = async (dados: DadosEtapa) => {
    setDadosForm(dados)
    setCriando(true)

    try {
      const resposta = await fetch('/api/pedidos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itens.map((i) => ({
            produtoId:  i.produtoId,
            quantidade: i.quantidade,
            preco:      i.preco,
          })),
          pagador: {
            nome:     dados.nome,
            email:    dados.email,
            cpf:      dados.cpf,
            telefone: dados.telefone,
          },
          endereco: {
            cep:         dados.cep,
            logradouro:  dados.logradouro,
            numero:      dados.numero,
            complemento: dados.complemento,
            bairro:      dados.bairro,
            cidade:      dados.cidade,
            estado:      dados.estado,
          },
          codigoCupom: cupom?.codigo,
        }),
      })

      const retorno = await resposta.json()

      if (!resposta.ok) {
        toast.error(retorno.mensagem ?? 'Erro ao criar pedido. Tente novamente.')
        return
      }

      // Limpa o carrinho após criar o pedido com sucesso
      limparCarrinho()
      setDadosPix(retorno)
      setEtapa(2)
    } catch {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setCriando(false)
    }
  }

  // ── Exibe spinner enquanto cria o pedido ──────────────────────
  if (criandoPedido) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-brand-500 mx-auto" />
          <p className="text-stone-600 font-medium">Criando seu pedido...</p>
          <p className="text-sm text-stone-400">Gerando QR code Pix</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Cabeçalho */}
        <div className="mb-8">
          <Link href="/catalogo" className="text-sm text-stone-500 hover:text-brand-600 transition-colors">
            ← Continuar comprando
          </Link>
          <h1 className="mt-3 font-playfair text-3xl font-bold text-stone-900">
            Finalizar Pedido
          </h1>
        </div>

        {/* Layout: formulário + resumo */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

          {/* Área principal (3/5) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">

              {/* Indicador de etapas */}
              <IndicadorEtapas etapaAtual={etapa} />

              {/* Etapa 1: Dados */}
              {etapa === 1 && (
                <EtapaDados
                  dadosIniciais={dadosForm ?? undefined}
                  aoAvancar={aoAvancarParaPix}
                />
              )}

              {/* Etapa 2: Pix */}
              {etapa === 2 && dadosPix && (
                <EtapaPix
                  numeroPedido={dadosPix.numeroPedido}
                  valorTotal={dadosPix.valorTotal}
                  qrCodeBase64={dadosPix.qrCodeBase64}
                  qrCodeTexto={dadosPix.qrCodeTexto}
                  expiracaoEm={dadosPix.expiracaoEm}
                />
              )}

            </div>
          </div>

          {/* Resumo do pedido (2/5) */}
          <div className="lg:col-span-2">
            <ResumoCheckout />
          </div>

        </div>
      </div>
    </div>
  )
}
