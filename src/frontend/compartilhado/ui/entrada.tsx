/**
 * Componente Entrada (Input) — Felipe's Bakery
 *
 * Campo de texto estilizado com as cores da marca.
 * Suporta ícones à esquerda e à direita, estado de erro e variantes.
 *
 * @example
 * <Entrada tipo="email" placeholder="seu@email.com" />
 * <Entrada iconeEsquerda={<Search />} placeholder="Buscar produtos..." />
 * <Entrada erro="E-mail inválido" />
 */

'use client'

import * as React from 'react'
import { cn }     from '@compartilhado/utils'

// ── Tipos ─────────────────────────────────────────────────────
export interface PropsEntrada extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Ícone exibido no lado esquerdo do campo */
  iconeEsquerda?: React.ReactNode
  /** Ícone ou botão exibido no lado direito do campo */
  iconeDireita?: React.ReactNode
  /** Mensagem de erro — torna a borda vermelha e exibe o texto abaixo */
  erro?: string
}

// ── Componente ────────────────────────────────────────────────
const Entrada = React.forwardRef<HTMLInputElement, PropsEntrada>(
  ({ className, type, iconeEsquerda, iconeDireita, erro, ...props }, ref) => {
    // Se há ícones, envolve em um container relativo
    if (iconeEsquerda || iconeDireita) {
      return (
        <div className="relative flex flex-col gap-1">
          {/* Ícone esquerdo */}
          {iconeEsquerda && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
              {iconeEsquerda}
            </div>
          )}

          {/* Campo de texto */}
          <input
            type={type}
            className={cn(
              // Base
              'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm',
              'text-stone-900 placeholder:text-stone-400',
              // Borda e foco
              'border-stone-300',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
              // Estados especiais
              'disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-60',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              // Padding com ícones
              iconeEsquerda && 'pl-10',
              iconeDireita  && 'pr-10',
              // Estado de erro
              erro && 'border-red-500 focus:ring-red-400',
              className,
            )}
            ref={ref}
            {...props}
          />

          {/* Ícone direito */}
          {iconeDireita && (
            <div className="absolute inset-y-0 right-3 flex items-center text-stone-400">
              {iconeDireita}
            </div>
          )}

          {/* Mensagem de erro */}
          {erro && (
            <span className="text-xs text-red-600">{erro}</span>
          )}
        </div>
      )
    }

    // Versão simples sem ícones
    return (
      <div className="flex flex-col gap-1">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm',
            'text-stone-900 placeholder:text-stone-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-60',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            erro && 'border-red-500 focus:ring-red-400',
            className,
          )}
          ref={ref}
          {...props}
        />
        {erro && (
          <span className="text-xs text-red-600">{erro}</span>
        )}
      </div>
    )
  },
)

Entrada.displayName = 'Entrada'

export { Entrada }
