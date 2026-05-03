/**
 * Componente Folha (Sheet/Drawer) — Felipe's Bakery
 *
 * Painel lateral deslizante baseado no Sheet do Radix UI (Dialog adaptado).
 * Usado para: menu mobile, carrinho lateral, filtros de catálogo.
 *
 * Posições disponíveis: topo, baixo, esquerda, direita (padrão: direita)
 *
 * @example
 * // Menu mobile que desliza da esquerda
 * <Folha>
 *   <FolhaGatilho asChild>
 *     <Botao variante="fantasma" tamanho="icone"><Menu /></Botao>
 *   </FolhaGatilho>
 *   <FolhaConteudo lado="esquerda">
 *     <FolhaCabecalho>
 *       <FolhaTitulo>Menu</FolhaTitulo>
 *     </FolhaCabecalho>
 *     <nav>...</nav>
 *   </FolhaConteudo>
 * </Folha>
 */

'use client'

import * as React        from 'react'
import * as DialogoRadix from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X }             from 'lucide-react'
import { cn }            from '@compartilhado/utils'

// Re-exportas dos primitivos
const Folha        = DialogoRadix.Root
const FolhaGatilho = DialogoRadix.Trigger
const FolhaPortal  = DialogoRadix.Portal
const FolhaFechar  = DialogoRadix.Close

// ── Overlay ───────────────────────────────────────────────────
const FolhaOverlay = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Overlay>
>(({ className, ...props }, ref) => (
  <DialogoRadix.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
))
FolhaOverlay.displayName = 'FolhaOverlay'

// ── Variantes de posição da Folha ─────────────────────────────
const variantesFolha = cva(
  [
    'fixed z-50 gap-4 bg-white p-6 shadow-xl',
    'transition ease-in-out',
    'data-[state=closed]:duration-300 data-[state=open]:duration-500',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
  ],
  {
    variants: {
      lado: {
        topo:     'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        baixo:    'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        esquerda: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        direita:  'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      lado: 'direita',
    },
  },
)

// ── Conteúdo da Folha ─────────────────────────────────────────
interface PropsFolhaConteudo
  extends React.ComponentPropsWithoutRef<typeof DialogoRadix.Content>,
    VariantProps<typeof variantesFolha> {}

const FolhaConteudo = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Content>,
  PropsFolhaConteudo
>(({ lado, className, children, ...props }, ref) => (
  <FolhaPortal>
    <FolhaOverlay />
    <DialogoRadix.Content
      ref={ref}
      className={cn(variantesFolha({ lado }), className)}
      {...props}
    >
      {children}
      {/* Botão de fechar */}
      <DialogoRadix.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogoRadix.Close>
    </DialogoRadix.Content>
  </FolhaPortal>
))
FolhaConteudo.displayName = 'FolhaConteudo'

// ── Cabeçalho e Títulos ───────────────────────────────────────
const FolhaCabecalho = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2', className)} {...props} />
)
FolhaCabecalho.displayName = 'FolhaCabecalho'

const FolhaRodape = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto pt-4', className)} {...props} />
)
FolhaRodape.displayName = 'FolhaRodape'

const FolhaTitulo = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Title>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Title>
>(({ className, ...props }, ref) => (
  <DialogoRadix.Title
    ref={ref}
    className={cn('font-playfair text-xl font-semibold text-stone-900', className)}
    {...props}
  />
))
FolhaTitulo.displayName = 'FolhaTitulo'

const FolhaDescricao = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Description>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Description>
>(({ className, ...props }, ref) => (
  <DialogoRadix.Description
    ref={ref}
    className={cn('text-sm text-stone-500', className)}
    {...props}
  />
))
FolhaDescricao.displayName = 'FolhaDescricao'

export {
  Folha,
  FolhaGatilho,
  FolhaPortal,
  FolhaFechar,
  FolhaOverlay,
  FolhaConteudo,
  FolhaCabecalho,
  FolhaRodape,
  FolhaTitulo,
  FolhaDescricao,
}
