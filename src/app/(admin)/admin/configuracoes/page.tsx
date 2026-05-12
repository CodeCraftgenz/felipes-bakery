/**
 * Página de Configurações — Felipe's Bakery Admin
 *
 * Permite editar todas as configurações globais da loja:
 *   - Informações: nome, contatos, e-mail
 *   - Ciclo de pedidos: dia/hora de corte, dia de entrega
 *   - Entrega: taxa de frete
 *   - Manutenção: ligar/desligar acesso público
 *
 * Server Component que carrega o estado atual e delega
 * a edição ao FormularioConfiguracoes (Client Component).
 */

import type { Metadata }            from 'next'
import { auth }                     from '@backend/lib/auth'
import { redirect }                 from 'next/navigation'
import { buscarConfiguracoes }      from '@backend/modulos/configuracoes/queries'
import { FormularioConfiguracoes }  from '@frontend/admin/configuracoes/FormularioConfiguracoes'

export const metadata: Metadata = {
  title:  'Configurações — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminConfiguracoesPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const config = await buscarConfiguracoes()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Configurações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Edite as configurações globais da loja
        </p>
      </div>

      <FormularioConfiguracoes config={config} />
    </div>
  )
}
