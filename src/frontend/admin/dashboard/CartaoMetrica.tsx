/**
 * CartaoMetrica — Felipe's Bakery Admin
 *
 * Card de KPI para o dashboard: ícone + título + valor + variação.
 */

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@compartilhado/utils'
import { Cartao, CartaoConteudo } from '@frontend/compartilhado/ui'

interface CartaoMetricaProps {
  titulo:    string
  valor:     string
  variacao?: number    // percentual, positivo = alta, negativo = baixa
  descricao?: string
  icone:     LucideIcon
  corIcone?: 'brand' | 'verde' | 'amarelo' | 'vermelho' | 'azul'
}

export function CartaoMetrica({
  titulo,
  valor,
  variacao,
  descricao,
  icone: Icone,
  corIcone = 'brand',
}: CartaoMetricaProps) {
  const coresIcone = {
    brand:    'bg-brand-100 text-brand-600',
    verde:    'bg-emerald-100 text-emerald-600',
    amarelo:  'bg-amber-100  text-amber-600',
    vermelho: 'bg-red-100    text-red-600',
    azul:     'bg-blue-100   text-blue-600',
  }

  const temVariacao = variacao !== undefined
  const variacaoPositiva = (variacao ?? 0) >= 0

  return (
    <Cartao className="transition-shadow hover:shadow-md">
      <CartaoConteudo className="p-6">
        <div className="flex items-start justify-between">
          {/* Info */}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{valor}</p>

            {/* Variação percentual ou descrição */}
            {temVariacao ? (
              <div className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                variacaoPositiva ? 'text-emerald-600' : 'text-red-500',
              )}>
                {variacao === 0
                  ? <Minus className="h-3 w-3" />
                  : variacaoPositiva
                    ? <TrendingUp  className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />
                }
                {Math.abs(variacao!)}% vs. mês anterior
              </div>
            ) : descricao ? (
              <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
            ) : null}
          </div>

          {/* Ícone */}
          <div className={cn('rounded-lg p-2.5', coresIcone[corIcone])}>
            <Icone className="h-5 w-5" />
          </div>
        </div>
      </CartaoConteudo>
    </Cartao>
  )
}
