/**
 * Componente Crachá (Badge) — Felipe's Bakery
 *
 * Etiqueta colorida para status, categorias e destaques.
 * Variantes:
 *   - padrao    → dourado (cor da marca) — para destaques
 *   - secundario → cinza — informações neutras
 *   - sucesso   → verde — pedido confirmado, em estoque
 *   - alerta    → amarelo — atenção, estoque baixo
 *   - perigo    → vermelho — cancelado, esgotado
 *   - contorno  → sem fundo — apenas borda
 *
 * @example
 * <Cracha variante="sucesso">Em Estoque</Cracha>
 * <Cracha variante="alerta">Últimas unidades</Cracha>
 * <Cracha variante="padrao">Destaque</Cracha>
 */

'use client'

import * as React                  from 'react'
import { cva, type VariantProps }  from 'class-variance-authority'
import { cn }                      from '@compartilhado/utils'

// ── Variantes do Crachá ───────────────────────────────────────
const variantesCracha = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variante: {
        padrao:     'bg-brand-100 text-brand-800',
        secundario: 'bg-stone-100 text-stone-700',
        sucesso:    'bg-green-100 text-green-800',
        alerta:     'bg-amber-100 text-amber-800',
        perigo:     'bg-red-100 text-red-800',
        contorno:   'border border-stone-300 text-stone-700',
      },
    },
    defaultVariants: {
      variante: 'padrao',
    },
  },
)

// ── Tipos ─────────────────────────────────────────────────────
export interface PropsCracha
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variantesCracha> {}

// ── Componente ────────────────────────────────────────────────
function Cracha({ className, variante, ...props }: PropsCracha) {
  return (
    <span
      className={cn(variantesCracha({ variante }), className)}
      {...props}
    />
  )
}

export { Cracha, variantesCracha }
