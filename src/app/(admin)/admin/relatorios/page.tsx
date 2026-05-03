/**
 * PÃ¡gina de RelatÃ³rios â€” Felipe's Bakery Admin
 *
 * Cards de acesso rÃ¡pido aos diferentes tipos de relatÃ³rio.
 * Server Component.
 */

import type { Metadata } from 'next'
import { auth }          from '@backend/lib/auth'
import { redirect }      from 'next/navigation'

export const metadata: Metadata = {
  title:  'RelatÃ³rios â€” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

// DefiniÃ§Ã£o dos relatÃ³rios disponÃ­veis
const relatorios = [
  {
    titulo:    'Vendas por PerÃ­odo',
    descricao: 'Analise o faturamento e volume de pedidos em um intervalo de datas.',
  },
  {
    titulo:    'Produtos Mais Vendidos',
    descricao: 'Veja quais produtos geram mais receita e tÃªm maior saÃ­da.',
  },
  {
    titulo:    'Clientes Ativos',
    descricao: 'Acompanhe a base de clientes e a frequÃªncia de compras.',
  },
  {
    titulo:    'Estoque CrÃ­tico',
    descricao: 'Identifique produtos com quantidade abaixo do nÃ­vel mÃ­nimo.',
  },
]

export default async function AdminRelatoriosPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  return (
    <div className="space-y-5">
      {/* CabeÃ§alho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">RelatÃ³rios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Visualize mÃ©tricas e dados do seu negÃ³cio
        </p>
      </div>

      {/* Grid de cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {relatorios.map((relatorio) => (
          <div
            key={relatorio.titulo}
            className="rounded-lg border border-border bg-white p-5 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-stone-800">{relatorio.titulo}</h2>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Em breve
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
