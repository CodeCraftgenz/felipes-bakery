/**
 * Componente Esqueleto (Skeleton) — Felipe's Bakery
 *
 * Placeholder animado para estados de carregamento.
 * Usa animação pulse suave com a paleta creme da marca.
 *
 * @example
 * // Esqueleto de um card de produto
 * <div className="space-y-2">
 *   <Esqueleto className="h-48 w-full rounded-xl" />
 *   <Esqueleto className="h-4 w-3/4" />
 *   <Esqueleto className="h-4 w-1/2" />
 * </div>
 */

'use client'

import { cn } from '@compartilhado/utils'

type PropsEsqueleto = React.HTMLAttributes<HTMLDivElement>

function Esqueleto({ className, ...props }: PropsEsqueleto) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-stone-200',
        className,
      )}
      aria-hidden="true"         // Oculta do leitor de tela (é apenas decorativo)
      {...props}
    />
  )
}

export { Esqueleto }
