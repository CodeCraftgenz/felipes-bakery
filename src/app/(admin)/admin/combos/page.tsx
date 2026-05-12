/**
 * Página de Combos — Felipe's Bakery Admin
 *
 * Gerenciamento de combos sazonais para datas comemorativas.
 * Combos ativos + dentro da validade aparecem em destaque na home pública.
 *
 * Server Component que carrega combos e produtos disponíveis,
 * delegando edição ao GerenciadorCombos (Client Component).
 */

import type { Metadata }       from 'next'
import { auth }                from '@backend/lib/auth'
import { redirect }            from 'next/navigation'
import { listarCombosAdmin }   from '@backend/modulos/combos/queries'
import { listarProdutosAdmin } from '@backend/modulos/produtos/queries'
import { GerenciadorCombos }   from '@frontend/admin/combos/GerenciadorCombos'

export const metadata: Metadata = {
  title:  'Combos — Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

export default async function AdminCombosPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const [combos, produtosPaginados] = await Promise.all([
    listarCombosAdmin(),
    listarProdutosAdmin({ porPagina: 200 }),
  ])

  const produtosOpcoes = produtosPaginados.itens
    .filter((p) => p.ativo === 1 && p.status === 'published')
    .map((p) => ({ id: p.id, nome: p.nome, preco: p.preco }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">Combos Sazonais</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Combos promocionais para Natal, Páscoa, Dia das Mães e outras datas.
          Quando ativos e dentro da validade, aparecem em destaque na vitrine.
        </p>
      </div>

      <GerenciadorCombos combosIniciais={combos} produtos={produtosOpcoes} />
    </div>
  )
}
