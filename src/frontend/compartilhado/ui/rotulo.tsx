/**
 * Componente Rótulo (Label) — Felipe's Bakery
 *
 * Label acessível para campos de formulário.
 * Automaticamente muda de estilo quando o campo associado está desabilitado.
 * Baseado no Label do Radix UI.
 *
 * @example
 * <Rotulo htmlFor="email">E-mail *</Rotulo>
 * <Entrada id="email" tipo="email" />
 */

'use client'

import * as React        from 'react'
import * as RotuloRadix  from '@radix-ui/react-label'
import { cva }           from 'class-variance-authority'
import { cn }            from '@compartilhado/utils'

// Variante base do rótulo
const variantesRotulo = cva(
  'text-sm font-medium leading-none text-stone-700 ' +
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
)

// ── Componente ────────────────────────────────────────────────
const Rotulo = React.forwardRef<
  React.ElementRef<typeof RotuloRadix.Root>,
  React.ComponentPropsWithoutRef<typeof RotuloRadix.Root>
>(({ className, ...props }, ref) => (
  <RotuloRadix.Root
    ref={ref}
    className={cn(variantesRotulo(), className)}
    {...props}
  />
))

Rotulo.displayName = RotuloRadix.Root.displayName

export { Rotulo }
