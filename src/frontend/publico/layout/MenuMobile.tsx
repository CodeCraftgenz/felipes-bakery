/**
 * Menu Mobile — Felipe's Bakery
 *
 * Menu de navegação para dispositivos móveis.
 * Desliza da esquerda usando o componente Folha.
 * Exibe os links de navegação + informações de contato + redes sociais.
 *
 * Usado dentro do Cabecalho em telas menores que md (768px).
 */

'use client'

import React         from 'react'
import Link          from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Phone, Instagram } from 'lucide-react'
import {
  Folha,
  FolhaGatilho,
  FolhaConteudo,
  FolhaCabecalho,
  FolhaTitulo,
} from '@frontend/compartilhado/ui/folha'
import { Botao }     from '@frontend/compartilhado/ui/botao'
import { Separador } from '@frontend/compartilhado/ui/separador'
import { cn }        from '@compartilhado/utils'

// ── Links de Navegação ────────────────────────────────────────
const linksMobile = [
  { href: '/',          rotulo: 'Início'    },
  { href: '/catalogo',  rotulo: 'Cardápio'  },
  { href: '/sobre',     rotulo: 'Nossa História' },
  { href: '/contato',   rotulo: 'Contato'   },
]

// ── Componente ────────────────────────────────────────────────
export function MenuMobile() {
  const caminho = usePathname()
  const [aberto, setAberto] = React.useState(false)

  return (
    <Folha open={aberto} onOpenChange={setAberto}>
      {/* Gatilho: ícone de hambúrguer */}
      <FolhaGatilho asChild>
        <Botao
          variante="fantasma"
          tamanho="icone"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Botao>
      </FolhaGatilho>

      {/* Painel lateral */}
      <FolhaConteudo lado="esquerda" className="flex flex-col">
        <FolhaCabecalho className="mb-6">
          <FolhaTitulo className="text-brand-700">
            Felipe&apos;s Bakery
          </FolhaTitulo>
          <p className="text-sm text-stone-500">
            Pães artesanais de fermentação natural
          </p>
        </FolhaCabecalho>

        {/* Links de navegação */}
        <nav className="flex flex-col gap-1">
          {linksMobile.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setAberto(false)}
              className={cn(
                'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                caminho === link.href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-stone-700 hover:bg-stone-100',
              )}
            >
              {link.rotulo}
            </Link>
          ))}
        </nav>

        <Separador className="my-6" />

        {/* Fazer pedido via WhatsApp */}
        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/5516997684430"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
          >
            <Botao variante="padrao" className="w-full gap-2">
              <Phone className="h-4 w-4" />
              Fazer Pedido pelo WhatsApp
            </Botao>
          </a>
        </div>

        {/* Rodapé do menu */}
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-3 text-stone-400">
            <a
              href="https://instagram.com/felipesbakery"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Felipe's Bakery"
              className="hover:text-brand-500 transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <span className="text-xs">@felipesbakery</span>
          </div>
        </div>
      </FolhaConteudo>
    </Folha>
  )
}
