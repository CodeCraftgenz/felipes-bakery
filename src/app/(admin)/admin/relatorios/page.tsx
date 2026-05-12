/**
 * Página de Relatórios — Felipe's Bakery Admin
 *
 * Dashboard de relatórios de vendas:
 *   - 4 KPIs do período (últimos 30 dias)
 *   - Gráfico de receita diária
 *   - Gráfico de receita mensal (12 meses)
 *   - Top produtos vendidos
 *   - Top clientes
 *   - Estoque crítico
 *
 * Server Component — todas as queries em paralelo.
 */

import type { Metadata } from 'next'
import { auth }          from '@backend/lib/auth'
import { redirect }      from 'next/navigation'
import {
  DollarSign,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'

import { buscarProdutosMaisVendidos } from '@backend/modulos/analytics/queries'
import {
  serieReceitaDiaria,
  serieReceitaMensal,
  resumoVendasPeriodo,
  topClientesPorValor,
  produtosEstoqueCritico,
} from '@backend/modulos/analytics/relatorios'

import { CartaoMetrica }              from '@frontend/admin/dashboard/CartaoMetrica'
import { ListaProdutosMaisVendidos }  from '@frontend/admin/dashboard/ListaProdutosMaisVendidos'
import { GraficoReceitaDiaria }       from '@frontend/admin/relatorios/GraficoReceitaDiaria'
import { GraficoReceitaMensal }       from '@frontend/admin/relatorios/GraficoReceitaMensal'
import { TabelaTopClientes }          from '@frontend/admin/relatorios/TabelaTopClientes'
import { TabelaEstoqueCritico }       from '@frontend/admin/relatorios/TabelaEstoqueCritico'

export const metadata: Metadata = {
  title:  'Relatórios — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(valor)
}

export default async function AdminRelatoriosPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  // Carrega todos os dados em paralelo
  const [
    resumo30d,
    serieDiaria,
    serieMensal,
    topProdutos,
    topClientes,
    estoqueAlerta,
  ] = await Promise.all([
    resumoVendasPeriodo(),
    serieReceitaDiaria(30),
    serieReceitaMensal(12),
    buscarProdutosMaisVendidos(8),
    topClientesPorValor(8),
    produtosEstoqueCritico(),
  ])

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Relatórios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Visão de vendas, clientes e estoque — últimos 30 dias
        </p>
      </div>

      {/* KPIs do período */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoMetrica
          titulo="Receita do Período"
          valor={formatarMoeda(resumo30d.receitaTotal)}
          descricao="Pedidos pagos nos últimos 30 dias"
          icone={DollarSign}
          corIcone="verde"
        />
        <CartaoMetrica
          titulo="Pedidos Pagos"
          valor={String(resumo30d.totalPedidos)}
          descricao="Confirmados via Pix"
          icone={Receipt}
          corIcone="brand"
        />
        <CartaoMetrica
          titulo="Ticket Médio"
          valor={formatarMoeda(resumo30d.ticketMedio)}
          descricao="Receita / pedidos"
          icone={TrendingUp}
          corIcone="azul"
        />
        <CartaoMetrica
          titulo="Unidades Vendidas"
          valor={String(resumo30d.unidadesVendidas)}
          descricao="Soma dos itens"
          icone={ShoppingBag}
          corIcone="amarelo"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GraficoReceitaDiaria  serie={serieDiaria}  />
        <GraficoReceitaMensal  serie={serieMensal}  />
      </div>

      {/* Tabelas: top produtos + top clientes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ListaProdutosMaisVendidos produtos={topProdutos} />
        <TabelaTopClientes         clientes={topClientes} />
      </div>

      {/* Estoque crítico (linha inteira) */}
      <TabelaEstoqueCritico produtos={estoqueAlerta} />
    </div>
  )
}
