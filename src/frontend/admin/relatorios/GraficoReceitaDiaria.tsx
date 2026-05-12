/**
 * GraficoReceitaDiaria — Felipe's Bakery Admin
 *
 * Gráfico de linha exibindo receita diária dos últimos N dias.
 * Client Component (recharts depende de window).
 */

'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
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

function formatarDataCurta(periodo: string): string {
  // periodo = 'YYYY-MM-DD' → 'DD/MM'
  const [, mes, dia] = periodo.split('-')
  return `${dia}/${mes}`
}

function formatarMoedaCurta(valor: number): string {
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1)}k`
  return `R$ ${valor.toFixed(0)}`
}

export function GraficoReceitaDiaria({ serie }: Props) {
  const dados = serie.map((p) => ({
    rotulo:  formatarDataCurta(p.periodo),
    receita: p.receita,
    pedidos: p.pedidos,
  }))

  return (
    <Cartao>
      <CartaoCabecalho>
        <CartaoTitulo>Receita Diária — últimos 30 dias</CartaoTitulo>
      </CartaoCabecalho>
      <CartaoConteudo>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
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
                formatter={(valor: number, nome: string) =>
                  nome === 'receita'
                    ? [
                        new Intl.NumberFormat('pt-BR', {
                          style:    'currency',
                          currency: 'BRL',
                        }).format(valor),
                        'Receita',
                      ]
                    : [valor, 'Pedidos']
                }
              />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="#C8933C"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CartaoConteudo>
    </Cartao>
  )
}
