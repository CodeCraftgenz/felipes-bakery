/**
 * Cabeçalho do Painel Admin — Felipe's Bakery
 *
 * Barra superior do painel administrativo com:
 *   - Botão hambúrguer para abrir a sidebar no mobile
 *   - Título da página atual (recebido como prop)
 *   - Nome e papel do usuário logado
 *   - Botão de logout
 *
 * Sempre presente no topo do layout admin.
 */

'use client'

import React          from 'react'
import { signOut }    from 'next-auth/react'
import { LogOut, Menu, User } from 'lucide-react'
import {
  Folha,
  FolhaGatilho,
  FolhaConteudo,
} from '@frontend/compartilhado/ui/folha'
import { Botao }      from '@frontend/compartilhado/ui/botao'
import { ConteudoSidebar } from './BarraLateral'
import { useAuth }    from '@frontend/compartilhado/hooks'
import { cn }         from '@compartilhado/utils'

// ── Mapa de labels para os papéis ─────────────────────────────
const LABEL_PAPEL: Record<string, string> = {
  admin_master: 'Administrador Master',
  admin:        'Administrador',
  operador:     'Operador',
  customer:     'Cliente',
}

// ── Props ─────────────────────────────────────────────────────
interface PropsCabecalhoAdmin {
  /** Título da página exibido na barra (ex: "Produtos", "Pedidos") */
  titulo?: string
}

// ── Componente ────────────────────────────────────────────────
export function CabecalhoAdmin({ titulo = 'Dashboard' }: PropsCabecalhoAdmin) {
  const { usuario, papel } = useAuth()

  const aoSairDoSistema = async () => {
    // Redireciona para a página de login admin após o logout
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 lg:px-6">

      {/* Lado esquerdo: hambúrguer (mobile) + título */}
      <div className="flex items-center gap-3">

        {/* Menu hambúrguer — abre a sidebar no mobile */}
        <Folha>
          <FolhaGatilho asChild>
            <Botao
              variante="fantasma"
              tamanho="icone"
              className="md:hidden"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </Botao>
          </FolhaGatilho>
          <FolhaConteudo lado="esquerda" className="p-0 w-60">
            <ConteudoSidebar />
          </FolhaConteudo>
        </Folha>

        {/* Título da página */}
        <h1 className="text-base font-semibold text-stone-800">
          {titulo}
        </h1>
      </div>

      {/* Lado direito: usuário + logout */}
      <div className="flex items-center gap-3">

        {/* Informações do usuário */}
        <div className="hidden sm:flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-brand-100 text-brand-700',
          )}>
            <User className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-stone-700 leading-none">
              {usuario?.name ?? 'Usuário'}
            </p>
            <p className="text-xs text-stone-400 leading-none mt-0.5">
              {papel ? (LABEL_PAPEL[papel] ?? papel) : ''}
            </p>
          </div>
        </div>

        {/* Botão de logout */}
        <Botao
          variante="fantasma"
          tamanho="icone"
          onClick={aoSairDoSistema}
          aria-label="Sair do sistema"
          title="Sair"
          className="text-stone-500 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </Botao>
      </div>

    </header>
  )
}
