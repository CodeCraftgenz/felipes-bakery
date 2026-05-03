/**
 * Componente Cartão (Card) — Felipe's Bakery
 *
 * Container visual com sombra e borda, estilo creme/artesanal.
 * Composto por subcomponentes para maior flexibilidade:
 *   - Cartao        → container externo
 *   - CartaoCabecalho → área do título (padding top)
 *   - CartaoTitulo  → título principal
 *   - CartaoDescricao → texto descritivo
 *   - CartaoConteudo → área principal do conteúdo
 *   - CartaoRodape  → área inferior (botões de ação)
 *
 * @example
 * <Cartao>
 *   <CartaoCabecalho>
 *     <CartaoTitulo>Pão Italiano</CartaoTitulo>
 *     <CartaoDescricao>Fermentação natural 18h</CartaoDescricao>
 *   </CartaoCabecalho>
 *   <CartaoConteudo>...</CartaoConteudo>
 *   <CartaoRodape>
 *     <Botao>Adicionar ao Carrinho</Botao>
 *   </CartaoRodape>
 * </Cartao>
 */

'use client'

import * as React from 'react'
import { cn }     from '@compartilhado/utils'

// ── Container Principal ───────────────────────────────────────
const Cartao = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-stone-200 bg-white shadow-sm',
      'transition-shadow duration-200 hover:shadow-md',
      className,
    )}
    {...props}
  />
))
Cartao.displayName = 'Cartao'

// ── Cabeçalho do Cartão ───────────────────────────────────────
const CartaoCabecalho = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CartaoCabecalho.displayName = 'CartaoCabecalho'

// ── Título do Cartão ──────────────────────────────────────────
const CartaoTitulo = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-playfair text-xl font-semibold leading-none tracking-tight text-stone-900',
      className,
    )}
    {...props}
  />
))
CartaoTitulo.displayName = 'CartaoTitulo'

// ── Descrição do Cartão ───────────────────────────────────────
const CartaoDescricao = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-stone-500 leading-relaxed', className)}
    {...props}
  />
))
CartaoDescricao.displayName = 'CartaoDescricao'

// ── Conteúdo Principal ────────────────────────────────────────
const CartaoConteudo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0', className)}
    {...props}
  />
))
CartaoConteudo.displayName = 'CartaoConteudo'

// ── Rodapé do Cartão ──────────────────────────────────────────
const CartaoRodape = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CartaoRodape.displayName = 'CartaoRodape'

export {
  Cartao,
  CartaoCabecalho,
  CartaoTitulo,
  CartaoDescricao,
  CartaoConteudo,
  CartaoRodape,
}
