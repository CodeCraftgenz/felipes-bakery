/**
 * Layout Raiz — Felipe's Bakery
 *
 * Configuração global da aplicação:
 *   - Fontes: Playfair Display (títulos) + Inter (corpo)
 *   - Metadata e Open Graph para SEO
 *   - Provedores globais: SessionProvider, QueryClient, Toaster
 *
 * Este componente é Server Component — os provedores client ficam
 * encapsulados no componente Provedores (Client Component).
 */

import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Provedores }              from '@frontend/compartilhado/providers'
import './globals.css'

// ─── Fontes ───────────────────────────────────────────────
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
})

// ─── Metadata Global ──────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default:  "Felipe's Bakery — Padaria Artesanal",
    template: "%s | Felipe's Bakery",
  },
  description:
    "Padaria artesanal de fermentação natural. Pães, ciabattas, focaccias e folhados feitos com ingredientes selecionados. Peça até quarta, receba na sexta.",
  keywords: [
    'padaria artesanal',
    'fermentação natural',
    'pão artesanal',
    "Felipe's Bakery",
    'ciabatta',
    'focaccia',
    'croissant',
  ],
  authors: [{ name: "Felipe's Bakery" }],
  creator: "Felipe's Bakery",
  openGraph: {
    type:   'website',
    locale: 'pt_BR',
    url:    process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Felipe's Bakery",
    title:  "Felipe's Bakery — Padaria Artesanal de Fermentação Natural",
    description:
      "Pães artesanais com fermentação natural e ingredientes selecionados. Peça até quarta, receba na sexta.",
    images: [
      {
        url:    '/images/og-image.jpg',
        width:  1200,
        height: 630,
        alt:    "Felipe's Bakery",
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       "Felipe's Bakery",
    description: 'Padaria artesanal de fermentação natural.',
    images:      ['/images/og-image.jpg'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export const viewport: Viewport = {
  themeColor:          '#C8933C',
  width:               'device-width',
  initialScale:        1,
  maximumScale:        5,
}

// ─── Root Layout ──────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-cream-100 text-brand-950 antialiased">
        {/* Provedores: SessionProvider + QueryClientProvider + Toaster */}
        <Provedores>
          {children}
        </Provedores>
      </body>
    </html>
  )
}
