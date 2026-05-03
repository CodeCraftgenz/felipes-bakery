# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking (no emit)

# Testing
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run test:e2e     # Playwright end-to-end

# Database
npm run db:generate  # Generate Drizzle migrations from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push schema directly to DB (dev only, skips migrations)
npm run db:studio    # Open Drizzle Studio in browser
npm run db:seed      # Seed admin user and sample data
```

## Architecture

### Directory Layout

```
src/
  app/          # Next.js App Router — pages and API routes only
  backend/      # Server-only code (never imported in Client Components)
  frontend/     # React components, split into admin/, publico/, compartilhado/
  compartilhado/ # Shared types, Zod schemas, utilities (safe for both sides)
banco/          # Drizzle schema (banco/schema/) and migrations
infra/          # Docker, Nginx, PM2 configs
```

### Path Aliases (tsconfig.json)

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@backend/*` | `src/backend/*` |
| `@frontend/*` | `src/frontend/*` |
| `@compartilhado/*` | `src/compartilhado/*` |
| `@schema` | `banco/schema/index.ts` |
| `@banco/*` | `banco/*` |
| `@env` | `src/compartilhado/env.ts` |

### App Router Groups

- `src/app/(public)/` — Public site (home, catalog, product detail, cart, checkout)
- `src/app/(admin)/` — Admin dashboard (protected, redirects to `/admin/login`)
- `src/app/api/` — API routes

### Backend Modules (`src/backend/modulos/`)

Each feature module follows the pattern:
- `queries.ts` — Read operations (SELECT)
- `mutations.ts` — Write operations (INSERT/UPDATE/DELETE, transactions)
- `admin-queries.ts` — Admin-specific paginated queries with filters

Modules: `analytics`, `banners`, `categorias`, `clientes`, `configuracoes`, `cupons`, `estoque`, `pedidos`, `produtos`

### Database Schema — Critical Naming

The schema lives in `banco/schema/` — TypeScript names are Portuguese, SQL names are English. Raw SQL template literals (`sql\`...\``) must always use the **SQL names**, never the TypeScript names.

| TypeScript (Drizzle) | SQL table |
|---|---|
| `pedidos` | `orders` |
| `clientes` | `customers` |
| `produtos` | `products` |
| `estoque` | `stock` |
| `categorias` | `categories` |
| `pedidoItens` | `order_items` |

Key field mappings:
- `pedidos.clienteId` → `customer_id`
- `pedidos.entregaNome` → `end_nome` (snapshot of customer name at purchase)
- `estoque.produtoId` → `product_id`
- `estoque.quantidade` → `quantity`
- `produtos.precoComparacao` → `compare_price` (NOT `precoCompare`)

Order status values (always English strings in DB): `pending_payment`, `paid`, `in_production`, `ready`, `out_for_delivery`, `delivered`, `cancelled`

### Authentication

NextAuth v5 (beta) — env var is `AUTH_SECRET` (not `NEXTAUTH_SECRET`).

Two auth flows in `src/backend/lib/auth/config.ts`:
- **Customers**: email/password + Google OAuth, 7-day session
- **Admin**: email/password only, 8-hour session, role stored in JWT

### Tailwind CSS

Using Tailwind **v3** (not v4) — requires `postcss.config.mjs`. The `globals.css` must use `@tailwind` directives, not `@import "tailwindcss"`.

Custom tokens defined in `tailwind.config.ts`:
- Colors: `brand` (wheat/gold), `cream` (off-white `#FAF6EF`), `terracotta`, `olive`
- Fonts: `font-playfair` (Playfair Display), `font-sans` (Inter)

### UI Components

All files in `src/frontend/compartilhado/ui/` require `'use client'` — they use `React.forwardRef`. Import via the barrel: `import { Botao, Cartao, Cracha, Entrada, Esqueleto } from '@frontend/compartilhado/ui'`.

### Cart State

Zustand store in `src/frontend/compartilhado/stores/carrinho.ts` with Immer + persist middleware. Persisted to localStorage under key `felipes-carrinho`.

### Payment Flow

Mercado Pago Pix only. Order lifecycle:
1. `POST /api/pedidos` creates order (`pending_payment`) + Pix QR code
2. `POST /api/webhook/mercadopago` confirms payment → status `paid` → stock decremented
3. Admin manually advances through: `in_production` → `ready` → `out_for_delivery` → `delivered`

### Code Conventions

- All comments and docstrings in **Portuguese (pt-BR)**
- TypeScript variable/function names may be English or Portuguese
- Server Components are the default; add `'use client'` only when needed (hooks, event handlers, browser APIs)
- `import 'server-only'` at the top of any file that must never reach the client bundle
- Admin pages always check auth: `const session = await auth(); if (!session?.user) redirect('/admin/login')`
- Admin pages use `export const revalidate = 0` (always fresh data)
- Soft deletes via `deleted_at` timestamp (never hard-delete produtos or clientes)
