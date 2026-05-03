/**
 * Layout do Site Público — Felipe's Bakery
 *
 * Aplicado em todas as páginas do site público (home, catálogo, produto, etc.)
 * Inclui: Cabeçalho, área de conteúdo principal, Rodapé e botão WhatsApp flutuante.
 */

import type { Metadata }     from 'next'
import { Cabecalho }         from '@frontend/publico/layout/Cabecalho'
import { Rodape }            from '@frontend/publico/layout/Rodape'
import { BotaoWhatsApp }     from '@frontend/publico/layout/BotaoWhatsApp'

export const metadata: Metadata = {}

export default function LayoutPublico({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Cabeçalho fixo com logo, navegação e carrinho */}
      <Cabecalho />

      {/* Conteúdo da página */}
      <main className="flex-1">
        {children}
      </main>

      {/* Rodapé com informações da padaria */}
      <Rodape />

      {/* Botão WhatsApp flutuante */}
      <BotaoWhatsApp />
    </div>
  )
}
