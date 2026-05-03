/**
 * Componente Diálogo (Dialog/Modal) — Felipe's Bakery
 *
 * Modal acessível baseado no Dialog do Radix UI.
 * Usado para confirmações, formulários rápidos e detalhes de pedidos.
 *
 * Subcomponentes:
 *   - Dialogo              → provedor de estado (open/close)
 *   - DialogoGatilho       → elemento que abre o modal
 *   - DialogoConteudo      → área do modal (centralizado + overlay)
 *   - DialogoCabecalho     → área do título
 *   - DialogoTitulo        → título principal
 *   - DialogoDescricao     → texto descritivo
 *   - DialogoRodape        → área de botões de ação
 *   - DialogoFechar        → botão X de fechar
 *
 * @example
 * <Dialogo>
 *   <DialogoGatilho asChild>
 *     <Botao>Excluir Produto</Botao>
 *   </DialogoGatilho>
 *   <DialogoConteudo>
 *     <DialogoCabecalho>
 *       <DialogoTitulo>Confirmar exclusão</DialogoTitulo>
 *     </DialogoCabecalho>
 *     <DialogoRodape>
 *       <DialogoFechar asChild><Botao variante="contorno">Cancelar</Botao></DialogoFechar>
 *       <Botao variante="perigo">Excluir</Botao>
 *     </DialogoRodape>
 *   </DialogoConteudo>
 * </Dialogo>
 */

'use client'

import * as React        from 'react'
import * as DialogoRadix from '@radix-ui/react-dialog'
import { X }             from 'lucide-react'
import { cn }            from '@compartilhado/utils'

// Re-exporta os primitivos que não precisam de estilo customizado
const Dialogo        = DialogoRadix.Root
const DialogoGatilho = DialogoRadix.Trigger
const DialogoPortal  = DialogoRadix.Portal
const DialogoFechar  = DialogoRadix.Close

// ── Overlay (fundo escuro) ─────────────────────────────────────
const DialogoOverlay = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Overlay>
>(({ className, ...props }, ref) => (
  <DialogoRadix.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      // Animações de entrada/saída
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogoOverlay.displayName = DialogoRadix.Overlay.displayName

// ── Conteúdo do Modal ─────────────────────────────────────────
const DialogoConteudo = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Content>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Content>
>(({ className, children, ...props }, ref) => (
  <DialogoPortal>
    <DialogoOverlay />
    <DialogoRadix.Content
      ref={ref}
      className={cn(
        // Posicionamento centralizado
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        // Dimensões e estilo
        'w-full max-w-lg rounded-xl bg-white p-6 shadow-xl',
        // Animações
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2',
        'duration-200',
        className,
      )}
      {...props}
    >
      {children}
      {/* Botão X para fechar */}
      <DialogoRadix.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogoRadix.Close>
    </DialogoRadix.Content>
  </DialogoPortal>
))
DialogoConteudo.displayName = DialogoRadix.Content.displayName

// ── Cabeçalho, Título e Descrição ─────────────────────────────
const DialogoCabecalho = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogoCabecalho.displayName = 'DialogoCabecalho'

const DialogoRodape = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)} {...props} />
)
DialogoRodape.displayName = 'DialogoRodape'

const DialogoTitulo = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Title>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Title>
>(({ className, ...props }, ref) => (
  <DialogoRadix.Title
    ref={ref}
    className={cn('font-playfair text-xl font-semibold text-stone-900', className)}
    {...props}
  />
))
DialogoTitulo.displayName = DialogoRadix.Title.displayName

const DialogoDescricao = React.forwardRef<
  React.ElementRef<typeof DialogoRadix.Description>,
  React.ComponentPropsWithoutRef<typeof DialogoRadix.Description>
>(({ className, ...props }, ref) => (
  <DialogoRadix.Description
    ref={ref}
    className={cn('text-sm text-stone-500', className)}
    {...props}
  />
))
DialogoDescricao.displayName = DialogoRadix.Description.displayName

export {
  Dialogo,
  DialogoGatilho,
  DialogoPortal,
  DialogoFechar,
  DialogoOverlay,
  DialogoConteudo,
  DialogoCabecalho,
  DialogoRodape,
  DialogoTitulo,
  DialogoDescricao,
}
