/**
 * Página Dashboard Admin "” Felipe's Bakery
 *
 * KPIs de receita, pedidos, clientes e produtos.
 * Dados carregados em paralelo no servidor via Promise.all.
 * Server Component "” sem dados sensíveis expostos ao cliente.
 */

import type { Metadata }      from 'next'
import { auth }               from '@backend/lib/auth'
import { redirect }           from 'next/navigation'
import {
  DollarSign, ShoppingCart, Users, Package, Clock,
} from 'lucide-react'
import {
  buscarMetricasDashboard,
  buscarPedidosRecentes,
  buscarProdutosMaisVendidos,
} from '@backend/modulos/analytics/queries'
import { CartaoMetrica }              from '@frontend/admin/dashboard/CartaoMetrica'
import { TabelaPedidosRecentes }      from '@frontend/admin/dashboard/TabelaPedidosRecentes'
import { ListaProdutosMaisVendidos }  from '@frontend/admin/dashboard/ListaProdutosMaisVendidos'

export const metadata: Metadata = {
  title:  'Dashboard "” Admin',
  robots: { index: false, follow: false },
}

// Sem cache "” dados financeiros devem ser sempre frescos
export const revalidate = 0

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(valor)
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  // Carrega todas as métricas em paralelo
  const [metricas, pedidosRecentes, topProdutos] = await Promise.all([
    buscarMetricasDashboard(),
    buscarPedidosRecentes(8),
    buscarProdutosMaisVendidos(5),
  ])

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Bem-vindo, {session.user.name} "” visão geral da sua padaria
        </p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoMetrica
          titulo="Receita Hoje"
          valor={formatarMoeda(metricas.receitaHoje)}
          descricao="Pedidos confirmados hoje"
          icone={DollarSign}
          corIcone="verde"
        />
        <CartaoMetrica
          titulo="Receita do Mês"
          valor={formatarMoeda(metricas.receitaMes)}
          variacao={metricas.variacaoReceita}
          icone={DollarSign}
          corIcone="brand"
        />
        <CartaoMetrica
          titulo="Pedidos Pendentes"
          valor={String(metricas.pedidosPendentes)}
          descricao="Aguardando ou em produção"
          icone={Clock}
          corIcone={metricas.pedidosPendentes > 10 ? 'amarelo' : 'azul'}
        />
        <CartaoMetrica
          titulo="Pedidos (30 dias)"
          valor={String(metricas.pedidosUltimos30d)}
          descricao="Excluídos os cancelados"
          icone={ShoppingCart}
          corIcone="azul"
        />
        <CartaoMetrica
          titulo="Clientes"
          valor={String(metricas.totalClientes)}
          descricao="Cadastros ativos"
          icone={Users}
          corIcone="verde"
        />
        <CartaoMetrica
          titulo="Produtos Ativos"
          valor={String(metricas.totalProdutos)}
          descricao="Publicados no catálogo"
          icone={Package}
          corIcone="brand"
        />
      </div>

      {/* Segunda linha: pedidos recentes (2/3) + top produtos (1/3) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TabelaPedidosRecentes pedidos={pedidosRecentes} />
        <ListaProdutosMaisVendidos produtos={topProdutos} />
      </div>
    </div>
  )
}
