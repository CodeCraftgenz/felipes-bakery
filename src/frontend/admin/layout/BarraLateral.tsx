/**
 * Barra Lateral (Sidebar) do Painel Admin — Felipe's Bakery
 *
 * Navegação principal do painel administrativo.
 * Comportamento:
 *   - Desktop: sidebar fixa à esquerda (largura 240px)
 *   - Mobile: oculta por padrão, abre como Folha ao clicar no menu
 *
 * Seções de navegação:
 *   - Principal: Dashboard
 *   - Catálogo: Produtos, Categorias, Estoque
 *   - Vendas: Pedidos, Clientes, Cupons
 *   - Marketing: Banners
 *   - Relatórios: Analytics, Exportações
 *   - Sistema: Configurações
 *
 * Visibilidade por papel:
 *   - admin_master / admin: acesso total
 *   - operador: apenas Pedidos e Estoque
 */

'use client'

import React                       from 'react'
import Link                        from 'next/link'
import { usePathname }             from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Tag,
  Layers,
  Image,
  Settings,
  ClipboardList,
  Boxes,
  Gift,
} from 'lucide-react'
import { cn }                      from '@compartilhado/utils'
import { useAuth }                 from '@frontend/compartilhado/hooks'

// ── Estrutura de Navegação ────────────────────────────────────

interface ItemNav {
  href:    string
  rotulo:  string
  icone:   React.ReactNode
  /** Papéis que podem ver este item (undefined = todos os admins) */
  papeis?: string[]
}

interface SecaoNav {
  titulo: string
  itens:  ItemNav[]
}

const secoes: SecaoNav[] = [
  {
    titulo: 'Principal',
    itens: [
      { href: '/admin/dashboard', rotulo: 'Dashboard',  icone: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    titulo: 'Catálogo',
    itens: [
      { href: '/admin/produtos',    rotulo: 'Produtos',    icone: <Package     className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
      { href: '/admin/categorias',  rotulo: 'Categorias',  icone: <Layers      className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
      { href: '/admin/estoque',     rotulo: 'Estoque',     icone: <Boxes       className="h-4 w-4" /> },
    ],
  },
  {
    titulo: 'Vendas',
    itens: [
      { href: '/admin/pedidos',   rotulo: 'Pedidos',   icone: <ShoppingCart  className="h-4 w-4" /> },
      { href: '/admin/clientes',  rotulo: 'Clientes',  icone: <Users         className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
      { href: '/admin/cupons',    rotulo: 'Cupons',    icone: <Tag           className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
    ],
  },
  {
    titulo: 'Marketing',
    itens: [
      { href: '/admin/banners', rotulo: 'Banners', icone: <Image className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
      { href: '/admin/combos',  rotulo: 'Combos',  icone: <Gift  className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
    ],
  },
  {
    titulo: 'Relatórios',
    itens: [
      { href: '/admin/relatorios',  rotulo: 'Relatórios',  icone: <BarChart2     className="h-4 w-4" />, papeis: ['admin_master', 'admin'] },
      { href: '/admin/logs',        rotulo: 'Logs',        icone: <ClipboardList className="h-4 w-4" />, papeis: ['admin_master'] },
    ],
  },
  {
    titulo: 'Sistema',
    itens: [
      { href: '/admin/configuracoes', rotulo: 'Configurações', icone: <Settings className="h-4 w-4" />, papeis: ['admin_master'] },
    ],
  },
]

// ── Link de Navegação ─────────────────────────────────────────
function LinkNav({ item, caminho }: { item: ItemNav; caminho: string }) {
  const ativo = caminho === item.href || caminho.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        ativo
          ? 'bg-brand-50 text-brand-700'
          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
      )}
    >
      <span className={ativo ? 'text-brand-600' : 'text-stone-400'}>
        {item.icone}
      </span>
      {item.rotulo}
    </Link>
  )
}

// ── Conteúdo da Sidebar (reutilizado em desktop e mobile) ─────
export function ConteudoSidebar() {
  const caminho = usePathname()
  const { papel } = useAuth()

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Marca */}
      <div className="flex h-14 items-center border-b border-stone-200 px-4">
        <Link
          href="/admin/dashboard"
          className="font-playfair text-base font-bold text-brand-700"
        >
          Felipe&apos;s Bakery
          <span className="ml-1.5 text-xs font-normal text-stone-400">Admin</span>
        </Link>
      </div>

      {/* Links de navegação */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {secoes.map((secao) => {
          // Filtra itens pelo papel do usuário
          const itensVisiveis = secao.itens.filter((item) => {
            if (!item.papeis) return true
            return papel ? item.papeis.includes(papel) : false
          })

          if (itensVisiveis.length === 0) return null

          return (
            <div key={secao.titulo}>
              {/* Título da seção */}
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                {secao.titulo}
              </p>
              {/* Links */}
              <div className="space-y-0.5">
                {itensVisiveis.map((item) => (
                  <LinkNav key={item.href} item={item} caminho={caminho} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>
    </div>
  )
}

// ── Sidebar Desktop ───────────────────────────────────────────
export function BarraLateral() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-stone-200 md:bg-white">
      <ConteudoSidebar />
    </aside>
  )
}
