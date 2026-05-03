/**
 * Página de Confirmação do Pedido — Felipe's Bakery
 *
 * Exibida após o pagamento Pix ser confirmado.
 * Mostra:
 *   - Número do pedido e status
 *   - Resumo dos itens comprados
 *   - Endereço de entrega
 *   - Data prevista de entrega
 *   - Link para acompanhar via WhatsApp
 *
 * Server Component — busca os dados do pedido diretamente do banco.
 */

import type { Metadata }          from 'next'
import Link                       from 'next/link'
import { notFound }               from 'next/navigation'
import {
  CheckCircle2,
  Package,
  MapPin,
  CalendarCheck,
  MessageCircle,
  ChevronRight,
} from 'lucide-react'
import { buscarPedidoPorNumero }  from '@backend/modulos/pedidos/queries'
import { Separador }              from '@frontend/compartilhado/ui/separador'
import { Cracha }                 from '@frontend/compartilhado/ui/cracha'
import { formatarMoeda, formatarData, calcularProximaEntrega } from '@compartilhado/utils'

// ── Mapa de status para label e variante ─────────────────────
const INFO_STATUS: Record<string, { label: string; variante: 'sucesso' | 'alerta' | 'perigo' | 'padrao' }> = {
  aguardando_pagamento: { label: 'Aguardando Pagamento', variante: 'alerta'   },
  confirmado:           { label: 'Confirmado',           variante: 'sucesso'  },
  em_producao:          { label: 'Em Produção',          variante: 'padrao'   },
  saiu_para_entrega:    { label: 'Saiu para Entrega',    variante: 'padrao'   },
  entregue:             { label: 'Entregue',             variante: 'sucesso'  },
  cancelado:            { label: 'Cancelado',            variante: 'perigo'   },
}

// ── Metadata ──────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>
}): Promise<Metadata> {
  const { numero } = await params
  return {
    title:  `Pedido ${numero} — Felipe's Bakery`,
    robots: { index: false },    // Não indexar páginas de pedido
  }
}

// ── Props ─────────────────────────────────────────────────────
interface PropsPaginaConfirmacao {
  params: Promise<{ numero: string }>
}

// ── Página ────────────────────────────────────────────────────
export default async function PaginaConfirmacao({ params }: PropsPaginaConfirmacao) {
  const { numero } = await params
  const pedido     = await buscarPedidoPorNumero(numero)

  if (!pedido) notFound()

  const infoStatus    = INFO_STATUS[pedido.status] ?? { label: pedido.status, variante: 'secundario' as const }
  const pedidoConfirmado = pedido.status === 'confirmado' || pedido.status === 'em_producao' ||
                           pedido.status === 'saiu_para_entrega' || pedido.status === 'entregue'

  // Calcula a próxima data de entrega (sexta-feira)
  const proximaEntrega = calcularProximaEntrega(3, 5, 23)
  const dataEntrega    = formatarData(proximaEntrega)

  // Mensagem de WhatsApp com o número do pedido
  const mensagemWhatsApp = encodeURIComponent(
    `Olá! Gostaria de acompanhar meu pedido ${numero} da Felipe's Bakery.`,
  )

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

        {/* ── Ícone de sucesso ─────────────────────────────────── */}
        {pedidoConfirmado && (
          <div className="mb-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="font-playfair text-3xl font-bold text-stone-900">
              Pedido Confirmado!
            </h1>
            <p className="mt-2 text-stone-500">
              Obrigado pela sua compra{pedido.nomeCliente ? `, ${pedido.nomeCliente.split(' ')[0]}` : ''}!
            </p>
          </div>
        )}

        {/* ── Card principal ────────────────────────────────────── */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">

          {/* Cabeçalho do card */}
          <div className="flex items-center justify-between bg-stone-50 border-b border-stone-200 px-6 py-4">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Número do Pedido</p>
              <p className="text-lg font-bold font-mono text-stone-900">{pedido.numeroPedido}</p>
            </div>
            <Cracha variante={infoStatus.variante}>
              {infoStatus.label}
            </Cracha>
          </div>

          <div className="p-6 space-y-6">

            {/* ── Itens comprados ─────────────────────────────── */}
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500 mb-4">
                <Package className="h-4 w-4" />
                Itens do Pedido
              </h2>
              <div className="space-y-3">
                {pedido.itens.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-stone-700">
                      <span className="font-medium text-stone-900">{item.quantidade}×</span>{' '}
                      {item.nomeProduto}
                    </span>
                    <span className="font-medium text-stone-900">
                      {formatarMoeda(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <Separador className="my-4" />

              {/* Total */}
              <div className="flex justify-between font-bold">
                <span className="text-stone-900">Total pago</span>
                <span className="text-lg text-stone-900">{formatarMoeda(pedido.total)}</span>
              </div>
            </section>

            <Separador />

            {/* ── Endereço de entrega ──────────────────────────── */}
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
                <MapPin className="h-4 w-4" />
                Endereço de Entrega
              </h2>
              <address className="not-italic text-sm text-stone-600 leading-relaxed">
                {pedido.endereco.logradouro}, {pedido.endereco.numero}
                {pedido.endereco.complemento && `, ${pedido.endereco.complemento}`}
                <br />
                {pedido.endereco.bairro} — {pedido.endereco.cidade}/{pedido.endereco.estado}
                <br />
                CEP: {(pedido.endereco.cep ?? '').replace(/(\d{5})(\d{3})/, '$1-$2')}
              </address>
            </section>

            <Separador />

            {/* ── Data de entrega ─────────────────────────────────── */}
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
                <CalendarCheck className="h-4 w-4" />
                Previsão de Entrega
              </h2>
              <p className="text-stone-800 font-medium">
                {dataEntrega} (sexta-feira)
              </p>
              <p className="text-sm text-stone-500 mt-1">
                Você receberá uma notificação quando o pedido sair para entrega.
              </p>
            </section>

          </div>
        </div>

        {/* ── Ações ─────────────────────────────────────────────── */}
        <div className="mt-6 space-y-3">

          {/* WhatsApp */}
          <a
            href={`https://wa.me/5516997684430?text=${mensagemWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm font-medium text-stone-700 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
          >
            <span className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              Acompanhar pedido pelo WhatsApp
            </span>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-brand-600 transition-colors" />
          </a>

          {/* Continuar comprando */}
          <Link
            href="/catalogo"
            className="flex items-center justify-between w-full rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm font-medium text-stone-700 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
          >
            <span className="flex items-center gap-3">
              <Package className="h-5 w-5 text-stone-400" />
              Ver mais produtos
            </span>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-brand-600 transition-colors" />
          </Link>

        </div>

        {/* ── Rodapé da confirmação ─────────────────────────────── */}
        <p className="mt-8 text-center text-xs text-stone-400">
          Uma cópia deste pedido foi enviada para o e-mail informado no checkout.
        </p>

      </div>
    </div>
  )
}
