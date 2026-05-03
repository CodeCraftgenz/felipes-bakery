/**
 * PÃ¡gina de Login Administrativo â€” Felipe's Bakery
 *
 * Tela de login escura com a marca da padaria.
 * Redireciona para /admin/dashboard apÃ³s autenticaÃ§Ã£o bem-sucedida.
 */

import type { Metadata }         from 'next'
import { auth }                  from '@backend/lib/auth'
import { redirect }              from 'next/navigation'
import { FormularioLoginAdmin }  from '@frontend/admin/auth/FormularioLoginAdmin'

export const metadata: Metadata = {
  title:  'Login â€” Felipe\'s Bakery Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  // Se jÃ¡ estÃ¡ autenticado como admin, redireciona
  const session = await auth()
  if (session?.user && (session.user as any).adminUser) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1410] px-4">
      {/* Card de login */}
      <div className="w-full max-w-sm">
        {/* Logo + tÃ­tulo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/20 text-2xl">
            ðŸ¥–
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">
            Felipe&apos;s Bakery
          </h1>
          <p className="mt-1 text-sm text-white/50">Painel Administrativo</p>
        </div>

        {/* FormulÃ¡rio */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
          <h2 className="mb-5 text-base font-semibold text-white">Entrar na conta</h2>
          <FormularioLoginAdmin />
        </div>

        {/* RodapÃ© */}
        <p className="mt-6 text-center text-xs text-white/30">
          Apenas funcionÃ¡rios autorizados.
        </p>
      </div>
    </div>
  )
}
