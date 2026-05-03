/**
 * Componente Separador — Felipe's Bakery
 *
 * Linha divisória horizontal ou vertical.
 * Baseado no Separator do Radix UI.
 *
 * @example
 * <Separador />                          // horizontal
 * <Separador orientacao="vertical" />    // vertical
 */

'use client'

import * as React          from 'react'
import * as SeparadorRadix from '@radix-ui/react-separator'
import { cn }              from '@compartilhado/utils'

// ── Tipos ─────────────────────────────────────────────────────
interface PropsSeparador
  extends React.ComponentPropsWithoutRef<typeof SeparadorRadix.Root> {
  orientacao?: 'horizontal' | 'vertical'
}

// ── Componente ────────────────────────────────────────────────
const Separador = React.forwardRef<
  React.ElementRef<typeof SeparadorRadix.Root>,
  PropsSeparador
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref,
  ) => (
    <SeparadorRadix.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-stone-200',
        // Horizontal: linha completa com 1px de altura
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
)

Separador.displayName = SeparadorRadix.Root.displayName

export { Separador }
