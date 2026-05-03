/**
 * Provedores Globais — Felipe's Bakery
 *
 * Agrupa todos os provedores React necessários para a aplicação.
 * Este componente é usado no Root Layout (src/app/layout.tsx).
 *
 * Provedores incluídos:
 *   1. SessionProvider  → NextAuth (sessão do usuário)
 *   2. QueryClientProvider → TanStack Query (cache de dados)
 *   3. Toaster          → Notificações toast (Sonner)
 *
 * IMPORTANTE: Este é um Client Component apenas para encapsular
 * os provedores. Os Server Components filhos continuam sendo server.
 */

'use client'

import React              from 'react'
import { SessionProvider } from 'next-auth/react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { Toaster }        from 'sonner'

// ── QueryClient — configuração padrão ─────────────────────────
// Criado fora do componente para evitar recriar a cada render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mantém dados em cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Não refaz a query automaticamente ao focar a janela (evita requisições desnecessárias)
      refetchOnWindowFocus: false,
      // Tenta novamente 2 vezes em caso de erro
      retry: 2,
    },
    mutations: {
      // Não tenta novamente em mutações (POST, PUT, DELETE) — evita efeitos colaterais duplos
      retry: 0,
    },
  },
})

// ── Props ─────────────────────────────────────────────────────
interface PropsProvedores {
  children: React.ReactNode
}

// ── Componente ────────────────────────────────────────────────
export function Provedores({ children }: PropsProvedores) {
  return (
    // NextAuth: gerencia a sessão do usuário em toda a aplicação
    <SessionProvider>
      {/* TanStack Query: gerencia o cache de dados do servidor */}
      <QueryClientProvider client={queryClient}>
        {children}

        {/* Toast notifications — posicionado no canto inferior direito */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast:   'font-inter text-sm',
              title:   'font-medium',
              success: 'border-green-200',
              error:   'border-red-200',
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  )
}
