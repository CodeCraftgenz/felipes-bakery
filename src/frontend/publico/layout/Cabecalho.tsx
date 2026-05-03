/**
 * Cabeçalho do Site Público — Felipe's Bakery
 *
 * Barra de navegação superior presente em todas as páginas do site.
 * Comportamento:
 *   - Desktop: logo + links de navegação + ícone do carrinho
 *   - Mobile: logo + ícone do carrinho + botão hambúrguer (MenuMobile)
 *   - Scroll: fundo branco com sombra ao rolar a página (efeito "sticky")
 *
 * Links de navegação: Início, Cardápio, Nossa História, Contato
 * Ícone do carrinho exibe a quantidade de itens
 */

'use client'

import React                       from 'react'
import Link                        from 'next/link'
import { usePathname }             from 'next/navigation'
import { ShoppingBag }             from 'lucide-react'
import { MenuMobile }              from './MenuMobile'
import { Botao }                   from '@frontend/compartilhado/ui/botao'
import { useCarrinho }             from '@frontend/compartilhado/stores/carrinho'
import { cn }                      from '@compartilhado/utils'

// ── Links de Navegação Desktop ────────────────────────────────
const linksNav = [
  { href: '/',         rotulo: 'Início'         },
  { href: '/catalogo', rotulo: 'Cardápio'       },
  { href: '/sobre',    rotulo: 'Nossa História' },
  { href: '/contato',  rotulo: 'Contato'        },
]

// ── Componente ────────────────────────────────────────────────
export function Cabecalho() {
  const caminho        = usePathname()
  const totalItens     = useCarrinho((s) => s.totalItens())
  const [rolado, setRolado] = React.useState(false)

  // Adiciona sombra ao cabeçalho ao rolar a página
  React.useEffect(() => {
    const aoRolar = () => setRolado(window.scrollY > 10)
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full transition-shadow duration-200',
        'bg-cream border-b border-stone-200',
        rolado ? 'shadow-sm' : 'shadow-none',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ──────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          aria-label="Felipe's Bakery — Página inicial"
        >
          <span className="font-playfair text-xl font-bold text-brand-700 tracking-tight">
            Felipe&apos;s Bakery
          </span>
        </Link>

        {/* ── Navegação Desktop (md+) ────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1">
          {linksNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                caminho === link.href
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-stone-600 hover:text-brand-700 hover:bg-brand-50',
              )}
            >
              {link.rotulo}
            </Link>
          ))}
        </nav>

        {/* ── Ações (carrinho + menu mobile) ─────────────────── */}
        <div className="flex items-center gap-2">
          {/* Botão do carrinho com contador */}
          <Link href="/carrinho" aria-label={`Carrinho — ${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`}>
            <Botao variante="fantasma" tamanho="icone" asChild>
              <span className="relative">
                <ShoppingBag className="h-5 w-5 text-stone-700" />

                {/* Contador de itens */}
                {totalItens > 0 && (
                  <span className={cn(
                    'absolute -right-1.5 -top-1.5',
                    'flex h-4 w-4 items-center justify-center',
                    'rounded-full bg-brand-500 text-[10px] font-bold text-white',
                  )}>
                    {totalItens > 9 ? '9+' : totalItens}
                  </span>
                )}
              </span>
            </Botao>
          </Link>

          {/* Menu hambúrguer (mobile) */}
          <div className="md:hidden">
            <MenuMobile />
          </div>
        </div>

      </div>
    </header>
  )
}
