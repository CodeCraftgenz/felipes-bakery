# Blueprint Técnico — Felipe's Bakery
> Versão 2.0 — Atualizado em 12/04/2026

---

## 1. Visão Geral do Projeto

**Felipe's Bakery** é uma padaria artesanal de fermentação natural. O sistema consiste em:
- **Site público** com catálogo, carrinho e checkout para pedidos semanais
- **Painel admin** para gestão de produtos, pedidos, estoque e relatórios
- **Ciclo de pedidos**: Pedidos aceitos até quarta-feira 23h → entrega na sexta-feira

---

## 2. Stack Tecnológica

| Camada          | Tecnologia                                    |
|-----------------|-----------------------------------------------|
| Framework       | Next.js 14+ (App Router, TypeScript strict)   |
| Banco de Dados  | MySQL 8.0 + Drizzle ORM                       |
| Autenticação    | NextAuth.js v5 (Credentials + Google OAuth)   |
| Autorização     | RBAC customizado                              |
| Estilização     | Tailwind CSS v4 + shadcn/ui + Radix UI        |
| Estado Global   | Zustand (carrinho)                            |
| Data Fetching   | TanStack Query                                |
| Storage         | Cloudflare R2 (S3-compatible)                 |
| Pagamentos      | Mercado Pago (Pix + cartão)                   |
| Email           | Resend + React Email                          |
| Cache/Filas     | Redis (Upstash) + BullMQ                      |
| Monitoramento   | Sentry + Pino logger                          |
| Testes          | Vitest + Playwright                           |
| CI/CD           | GitHub Actions → SSH → VPS                   |
| Infraestrutura  | Docker, Nginx, PM2 cluster                    |

---

## 3. Princípios de Organização

1. **Separação clara**: backend / frontend / infraestrutura em pastas distintas
2. **Admin isolado**: painel admin completamente separado do site público na estrutura de pastas
3. **Comentários em Português (PT-BR)**: todo código comentado em português
4. **Server-only**: nada do banco ou auth vaza para Client Components
5. **Modular**: cada domínio de negócio em seu próprio módulo

---

## 4. Estrutura de Pastas

```
felipes-bakery/
│
├── src/
│   ├── app/                               # Next.js App Router (apenas rotas)
│   │   ├── (publico)/                     # Site público
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                   # Home
│   │   │   ├── catalogo/
│   │   │   ├── produto/[slug]/
│   │   │   └── carrinho/
│   │   │
│   │   ├── (admin)/                       # Painel administrativo
│   │   │   ├── layout.tsx
│   │   │   ├── admin/login/
│   │   │   ├── admin/dashboard/
│   │   │   ├── admin/produtos/
│   │   │   ├── admin/pedidos/
│   │   │   ├── admin/estoque/
│   │   │   ├── admin/clientes/
│   │   │   ├── admin/cupons/
│   │   │   ├── admin/relatorios/
│   │   │   ├── admin/banners/
│   │   │   └── admin/configuracoes/
│   │   │
│   │   ├── (auth)/                        # Autenticação de clientes
│   │   │   ├── login/
│   │   │   ├── cadastro/
│   │   │   └── recuperar-senha/
│   │   │
│   │   ├── (conta)/                       # Área do cliente logado
│   │   │   ├── minha-conta/
│   │   │   ├── meus-pedidos/
│   │   │   └── enderecos/
│   │   │
│   │   ├── api/                           # Route Handlers
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── produtos/
│   │   │   ├── pedidos/
│   │   │   ├── pagamento/
│   │   │   └── webhook/
│   │   │
│   │   ├── layout.tsx                     # Root layout
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   │
│   ├── backend/                           # APENAS CÓDIGO SERVIDOR
│   │   ├── modulos/                       # Domínios de negócio
│   │   │   ├── produtos/
│   │   │   │   ├── queries.ts             # Leitura do banco
│   │   │   │   ├── mutations.ts           # Escrita no banco
│   │   │   │   └── service.ts             # Lógica de negócio
│   │   │   ├── pedidos/
│   │   │   ├── estoque/
│   │   │   ├── cupons/
│   │   │   ├── pagamentos/
│   │   │   ├── clientes/
│   │   │   ├── analytics/
│   │   │   └── configuracoes/
│   │   │
│   │   └── lib/
│   │       ├── banco/index.ts             # Drizzle singleton
│   │       ├── auth/
│   │       │   ├── config.ts              # Provedores NextAuth
│   │       │   └── index.ts               # Handlers + RBAC
│   │       ├── redis.ts
│   │       ├── storage.ts                 # Cloudflare R2
│   │       ├── email.ts                   # Resend
│   │       └── pagamento.ts               # Mercado Pago
│   │
│   ├── frontend/                          # COMPONENTES REACT
│   │   ├── publico/
│   │   │   ├── layout/                    # Cabecalho, Rodape, BotaoWhatsApp
│   │   │   ├── home/
│   │   │   ├── catalogo/
│   │   │   ├── produto/
│   │   │   ├── carrinho/
│   │   │   └── checkout/
│   │   │
│   │   ├── admin/
│   │   │   ├── layout/                    # BarraLateral, CabecalhoAdmin
│   │   │   ├── dashboard/
│   │   │   ├── produtos/
│   │   │   ├── pedidos/
│   │   │   ├── estoque/
│   │   │   └── relatorios/
│   │   │
│   │   └── compartilhado/
│   │       ├── ui/                        # Componentes shadcn/ui (PT-BR)
│   │       ├── hooks/                     # Hooks customizados
│   │       ├── stores/                    # Zustand (carrinho)
│   │       └── providers/                 # QueryProvider, AuthProvider
│   │
│   ├── compartilhado/                     # COMPARTILHADO servidor+cliente
│   │   ├── types/
│   │   ├── validacoes/                    # Schemas Zod
│   │   ├── utils/index.ts                 # Funções puras
│   │   └── env.ts
│   │
│   └── middleware.ts
│
├── banco/
│   ├── schema/
│   │   ├── usuarios.ts
│   │   ├── clientes.ts
│   │   ├── categorias.ts
│   │   ├── produtos.ts
│   │   ├── estoque.ts
│   │   ├── pedidos.ts
│   │   ├── pagamentos.ts
│   │   ├── cupons.ts
│   │   ├── analytics.ts
│   │   ├── misc.ts
│   │   └── index.ts
│   ├── migrations/
│   └── seeds/
│       └── seed.ts
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml             # Dev: MySQL + Redis
│   │   └── docker-compose.prod.yml        # Produção completa
│   ├── nginx/
│   │   ├── nginx.conf                     # SSL, proxy, CSP, rate limiting
│   │   └── proxy_params
│   └── pm2/
│       └── ecosystem.config.js            # Cluster mode
│
├── docs/
│   ├── blueprint.md
│   └── deployment.md
│
├── .github/workflows/ci.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── .env.example
└── .gitignore
```

---

## 5. Aliases de Importação

| Alias               | Aponta para                    |
|---------------------|--------------------------------|
| `@/*`               | `./src/*`                      |
| `@backend/*`        | `./src/backend/*`              |
| `@frontend/*`       | `./src/frontend/*`             |
| `@compartilhado/*`  | `./src/compartilhado/*`        |
| `@banco/*`          | `./banco/*`                    |
| `@schema`           | `./banco/schema/index.ts`      |
| `@env`              | `./src/compartilhado/env.ts`   |

---

## 6. Papéis e Permissões (RBAC)

| Papel          | Descrição                     | Acesso                               |
|----------------|-------------------------------|--------------------------------------|
| `admin_master` | Felipe — dono da padaria      | Tudo (`*`)                           |
| `admin`        | Funcionário administrativo    | Produtos, pedidos, relatórios        |
| `operador`     | Funcionário de operações      | Apenas pedidos e estoque             |
| `customer`     | Cliente do site               | Sem acesso ao painel                 |

---

## 7. Ciclo de Pedidos

```
Segunda ─────── Quarta 23h ──────── Sexta
└─ Pedidos abertos  └─ Corte       └─ Entrega
```

Configurável via tabela `configuracoes` (id=1):
- `diaCorte` (padrão: 3 = Quarta-feira)
- `horaCorte` (padrão: 23)
- `diaEntrega` (padrão: 5 = Sexta-feira)

---

## 8. Cardápio Atual

### Pães Rústicos
| Produto                           | Peso  | Preço    |
|-----------------------------------|-------|----------|
| Pão Italiano                      | 450g  | R$ 15,50 |
| Campagne Grãos & Azeitona         | 600g  | R$ 27,00 |
| Pão Cacau & Chocolate             | 600g  | R$ 30,00 |
| Pão Cacau, Chocolate & Laranja    | 600g  | R$ 30,00 |
| Ciabatta Tradicional              | 300g  | R$ 15,00 |
| Ciabatta com Nozes                | 330g  | R$ 18,00 |
| Ciabatta com Azeitona             | 330g  | R$ 18,00 |
| Focaccia Azeitona & Tomate Confit | 450g  | R$ 30,00 |

### Semi-Integral
| Produto                      | Peso  | Preço    |
|------------------------------|-------|----------|
| Semi-integral com Sementes   | 600g  | R$ 18,00 |

### Folhado Artesanal
| Produto               | Peso | Preço    |
|-----------------------|------|----------|
| Croissant Tradicional | —    | R$ 12,00 |
| Kouign-amann          | 60g  | R$ 12,00 |

---

## 9. Identidade Visual

| Elemento       | Valor                     |
|----------------|---------------------------|
| Cor principal  | `#C8933C` Dourado Trigo   |
| Fundo          | `#FAF6EF` Creme Artesanal |
| Texto          | `#1A1207` Marrom Escuro   |
| Fonte títulos  | Playfair Display (serif)  |
| Fonte corpo    | Inter (sans-serif)        |

---

## 10. Decisões de Arquitetura

| Decisão               | Escolha          | Motivo                                         |
|-----------------------|------------------|------------------------------------------------|
| Arquitetura           | Monolito modular | Equipe pequena, simples de deployar            |
| ORM                   | Drizzle          | Melhor performance que Prisma com MySQL        |
| Pagamentos            | Mercado Pago     | Pix nativo, público brasileiro                 |
| Analytics             | Próprio (MySQL)  | LGPD, sem terceiros                            |
| Storage               | Cloudflare R2    | Sem custo de egress, CDN global                |
| Deploy                | VPS              | Custo previsível, mesma rede do MySQL          |
| Sessões               | JWT              | Reduz queries                                  |
| Processo              | PM2 cluster      | Zero-downtime, múltiplos núcleos               |

---

## 11. Fases de Desenvolvimento

| Fase | Descrição                                         | Status          |
|------|---------------------------------------------------|-----------------|
| 1    | Fundação (estrutura, banco, auth, seed)           | ✅ Concluída    |
| 2    | Design System (shadcn/ui, layouts, providers)     | 🔄 Em andamento |
| 3    | Site Público (home, catálogo, produto, carrinho)  | ⏳ Pendente     |
| 4    | Checkout e Pagamentos (Mercado Pago, Pix)         | ⏳ Pendente     |
| 5    | Painel Admin (CRUD produtos, pedidos, estoque)    | ⏳ Pendente     |
| 6    | Funcionalidades Avançadas (email, filas)          | ⏳ Pendente     |
| 7    | Testes, Performance e Deploy                      | ⏳ Pendente     |

---

## 12. Contato da Loja

- **WhatsApp**: (16) 997 684 430
- **E-mail**: contato@felipesbakery.com.br
- **Domínio**: felipesbakery.com.br (Hostinger)
