/**
 * Componente Botão — Felipe's Bakery
 *
 * Wrapper tipado do Button do shadcn/ui com variantes da marca.
 * Variantes disponíveis:
 *   - padrao   → fundo dourado (cor principal da marca)
 *   - contorno → borda dourada, fundo transparente
 *   - fantasma → sem borda, fundo transparente
 *   - perigo   → vermelho, para ações destrutivas
 *   - link     → aparência de link clicável
 *
 * Tamanhos: p (pequeno), m (médio, padrão), g (grande), icone
 *
 * @example
 * <Botao variante="padrao" tamanho="g">
 *   Adicionar ao Carrinho
 * </Botao>
 */

'use client'

import * as React          from 'react'
import { Slot }            from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn }              from '@compartilhado/utils'

// ── Variantes do Botão ────────────────────────────────────────
const variantesBotao = cva(
  // Classes base aplicadas em todas as variantes
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md text-sm font-medium',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variante: {
        // Botão principal — Dourado Trigo
        padrao:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
        // Botão secundário — contorno dourado
        contorno: 'border border-brand-500 bg-transparent text-brand-600 hover:bg-brand-50 active:bg-brand-100',
        // Botão sutil — sem borda
        fantasma: 'bg-transparent text-brand-700 hover:bg-brand-50 active:bg-brand-100',
        // Botão destrutivo — vermelho
        perigo:   'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        // Botão link — aparência de hiperlink
        link:     'text-brand-600 underline-offset-4 hover:underline',
        // Variante neutra para o painel admin
        secundario: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-300',
      },
      tamanho: {
        p:     'h-8 px-3 text-xs',
        m:     'h-10 px-4 py-2',
        g:     'h-11 px-6 text-base',
        icone: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variante: 'padrao',
      tamanho:  'm',
    },
  },
)

// ── Tipos ─────────────────────────────────────────────────────
export interface PropsBotao
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBotao> {
  /** Se true, o Botão renderiza como o componente filho (pattern Slot do Radix) */
  asChild?: boolean
}

// ── Componente ────────────────────────────────────────────────
const Botao = React.forwardRef<HTMLButtonElement, PropsBotao>(
  ({ className, variante, tamanho, asChild = false, ...props }, ref) => {
    const Componente = asChild ? Slot : 'button'

    return (
      <Componente
        className={cn(variantesBotao({ variante, tamanho, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)

Botao.displayName = 'Botao'

export { Botao, variantesBotao }
