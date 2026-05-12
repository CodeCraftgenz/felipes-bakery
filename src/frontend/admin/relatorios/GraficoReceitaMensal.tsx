/**
 * GraficoReceitaMensal — Felipe's Bakery Admin
 *
 * Barras de receita mensal nos últimos 12 meses.
 * Client Component.
 */

'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Cartao, CartaoCabecalho, CartaoTitulo, CartaoConteudo } from '@frontend/compartilhado/ui'
import type { SerieReceita } from '@backend/modulos/analytics/relatorios'

interface Props {
  serie: SerieReceita[]
}

const NOMES_MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

function formatarMesCurto(periodo: string): string {
  // periodo = 'YYYY-MM'
  const [ano, mes] = periodo.split('-')
  const indice = Number(mes) - 1
  return `${NOMES_MESES[indice] ?? mes}/${ano.slice(-2)}`
}

function formatarMoedaCurta(valor: number): string {
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1)}k`
  return `R$ ${valor.toFixed(0)}`
}

export function GraficoReceitaMensal({ serie }: Props) {
  const dados = serie.map((p) => ({
    rotulo:  formatarMesCurto(p.periodo),
    receita: p.receita,
    pedidos: p.pedidos,
  }))

  return (
    <Cartao>
      <CartaoCabecalho>
        <CartaoTitulo>Receita Mensal — últimos 12 meses</CartaoTitulo>
      </CartaoCabecalho>
      <CartaoConteudo>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="rotulo"
                tick={{ fontSize: 11, fill: '#78716c' }}
                stroke="#a8a29e"
              />
              <YAxis
                tickFormatter={formatarMoedaCurta}
                tick={{ fontSize: 11, fill: '#78716c' }}
                stroke="#a8a29e"
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background:   '#fff',
                  border:       '1px solid #e7e5e4',
                  borderRadius: '8px',
                  fontSize:     '12px',
                }}
                formatter={(valor: number) => [
                  new Intl.NumberFormat('pt-BR', {
                    style:    'currency',
                    currency: 'BRL',
                  }).format(valor),
                  'Receita',
                ]}
              />
              <Bar dataKey="receita" fill="#C8933C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CartaoConteudo>
    </Cartao>
  )
}
