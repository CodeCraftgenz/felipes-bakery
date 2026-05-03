/**
 * PÃ¡gina de ConfiguraÃ§Ãµes â€” Felipe's Bakery Admin
 *
 * Exibe as configuraÃ§Ãµes globais da loja agrupadas por seÃ§Ã£o.
 * Server Component.
 */

import type { Metadata }        from 'next'
import { auth }                 from '@backend/lib/auth'
import { redirect }             from 'next/navigation'
import { buscarConfiguracoes }  from '@backend/modulos/configuracoes/queries'

export const metadata: Metadata = {
  title:  'ConfiguraÃ§Ãµes â€” Admin',
  robots: { index: false, follow: false },
}

export const revalidate = 0

// Nomes dos dias da semana em portuguÃªs
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'TerÃ§a-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'SÃ¡bado']

function formatarMoeda(valor: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))
}

export default async function AdminConfiguracoesPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const config = await buscarConfiguracoes()

  return (
    <div className="space-y-5">
      {/* CabeÃ§alho */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-950">ConfiguraÃ§Ãµes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          ConfiguraÃ§Ãµes globais da loja
        </p>
      </div>

      {/* SeÃ§Ã£o: InformaÃ§Ãµes da Loja */}
      <section className="rounded-lg border border-border bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-stone-800">InformaÃ§Ãµes da Loja</h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome da Loja</dt>
            <dd className="mt-0.5 text-stone-800">{config.nomeLoja}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WhatsApp</dt>
            <dd className="mt-0.5 text-stone-800">{config.whatsapp ?? 'â€”'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone</dt>
            <dd className="mt-0.5 text-stone-800">{config.telefone ?? 'â€”'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail de Contato</dt>
            <dd className="mt-0.5 text-stone-800">{config.emailContato ?? 'â€”'}</dd>
          </div>
        </dl>
      </section>

      {/* SeÃ§Ã£o: Ciclo de Pedidos */}
      <section className="rounded-lg border border-border bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-stone-800">Ciclo de Pedidos</h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dia de Corte</dt>
            <dd className="mt-0.5 text-stone-800">{DIAS_SEMANA[config.diaCorte]}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hora de Corte</dt>
            <dd className="mt-0.5 text-stone-800">{String(config.horaCorte).padStart(2, '0')}:00</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dia de Entrega</dt>
            <dd className="mt-0.5 text-stone-800">{DIAS_SEMANA[config.diaEntrega]}</dd>
          </div>
        </dl>
      </section>

      {/* SeÃ§Ã£o: ConfiguraÃ§Ãµes de Entrega */}
      <section className="rounded-lg border border-border bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-stone-800">ConfiguraÃ§Ãµes de Entrega</h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxa de Frete</dt>
            <dd className="mt-0.5 text-stone-800">
              {Number(config.taxaFrete) === 0 ? 'GrÃ¡tis' : formatarMoeda(config.taxaFrete)}
            </dd>
          </div>
        </dl>
      </section>

      {/* SeÃ§Ã£o: ManutenÃ§Ã£o */}
      <section className="rounded-lg border border-border bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-stone-800">ManutenÃ§Ã£o</h2>
        <div className="flex items-center gap-3">
          <span
            className={[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              config.modoManutencao
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700',
            ].join(' ')}
          >
            {config.modoManutencao ? 'ManutenÃ§Ã£o ativa' : 'Site operacional'}
          </span>
          <span className="text-sm text-muted-foreground">
            {config.modoManutencao
              ? 'O site pÃºblico estÃ¡ em modo de manutenÃ§Ã£o.'
              : 'O site estÃ¡ acessÃ­vel ao pÃºblico.'}
          </span>
        </div>
      </section>
    </div>
  )
}
