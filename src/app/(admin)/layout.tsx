/**
 * Layout do Painel Administrativo — Felipe's Bakery
 *
 * Aplicado em todas as páginas do admin (exceto a página de login).
 * Estrutura: Sidebar (desktop) | Conteúdo com Header no topo.
 *
 * A proteção de acesso (autenticação + papel) é feita pelo middleware.
 * Veja: src/middleware.ts
 */

import { BarraLateral }    from '@frontend/admin/layout/BarraLateral'
import { CabecalhoAdmin }  from '@frontend/admin/layout/CabecalhoAdmin'

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-stone-50">

      {/* Sidebar de navegação (visível em md+) */}
      <BarraLateral />

      {/* Área principal: cabeçalho + conteúdo */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Cabeçalho: hambúrguer mobile + título + usuário + logout */}
        <CabecalhoAdmin />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  )
}
