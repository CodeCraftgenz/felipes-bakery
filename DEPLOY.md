# Deploy — Felipe's Bakery na Hostinger

Guia passo a passo para publicar o Felipe's Bakery em um plano Hostinger
**Node.js Web App** (hosting gerenciado, sem Docker / sem root).

## Pré-requisitos

- Conta na Hostinger com plano que inclui Node.js Web App
- Repositório do projeto no GitHub
- Conta no Upstash ([https://redis.upstash.com](https://redis.upstash.com)) — gratuita
- Conta no Resend ([https://resend.com](https://resend.com)) para envio de e-mails
- Conta de produção no Mercado Pago

## Passo 1 — Banco de Dados MySQL

1. No painel da Hostinger acesse **Databases → Create Database** (MySQL).
2. Anote: `host`, `database name`, `user`, `password`.
3. Monte a `DATABASE_URL`:
   ```
   mysql://USER:PASS@HOST:3306/DATABASE
   ```
4. (Opcional) Garanta que o usuário tem permissão para `CREATE`, `ALTER`, `DROP`
   — necessário para rodar `npm run db:migrate`.

## Passo 2 — Redis (Upstash) — OPCIONAL

O app funciona sem Redis: cache desativado e e-mails enviados de forma
síncrona. Em produção, porém, é recomendável habilitar:

1. Acesse [https://redis.upstash.com](https://redis.upstash.com) → **Create Database**.
2. Escolha a região mais próxima do servidor da Hostinger.
3. Copie a URL no formato `rediss://default:TOKEN@HOST:PORT`.
4. Use como `REDIS_URL` nas variáveis de ambiente.

## Passo 3 — Variáveis de Ambiente na Hostinger

No painel do **Node.js Web App → Environment Variables**, adicione:

| Variável | Valor / Como obter |
|----------|--------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL MySQL do Passo 1 |
| `AUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Mesmo valor de `AUTH_SECRET` (compatibilidade) |
| `NEXTAUTH_URL` | URL final, ex: `https://felipesbakery.com.br` |
| `NEXT_PUBLIC_APP_URL` | Mesma URL do `NEXTAUTH_URL` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token `APP_USR-...` do painel do MP |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Public key do MP |
| `RESEND_API_KEY` | API key do Resend |
| `RESEND_FROM_EMAIL` | Endereço verificado no Resend |
| `REDIS_URL` | URL do Upstash (opcional) |
| `R2_*` | Credenciais Cloudflare R2 (se usar uploads) |

> A Hostinger injeta automaticamente a variável `PORT` — o `npm start` já usa
> `next start -p ${PORT:-3000}` e respeita esse valor.

## Passo 4 — Deploy

1. No painel da Hostinger conecte o repositório GitHub.
2. Configure:
   - **Build command**: `npm run build`
   - **Start command**: `npm start`
   - **Node.js version**: `20` (já fixado em `.nvmrc` e `.node-version`)
3. Inicie o deploy.

> Não habilitamos `output: 'standalone'` no `next.config.ts` — o `next start`
> padrão é mais simples e compatível com hosting gerenciado.

## Passo 5 — Migrations e Seed

Após o primeiro deploy bem-sucedido, abra o terminal SSH (ou o terminal
embutido do painel) e rode, na raiz do app:

```bash
npm run db:migrate    # aplica todas as migrations Drizzle
npm run db:seed       # cria admin inicial e dados de exemplo (1ª vez apenas)
```

> **Importante**: não adicionamos `postinstall: db:migrate` automático para
> evitar quebrar deploys futuros se o banco estiver indisponível ou se as
> credenciais ainda não estiverem configuradas. Rode manualmente ou crie um
> script de release dedicado.

## Passo 6 — Domínio e SSL

A Hostinger configura SSL (Let's Encrypt) automaticamente ao apontar um
domínio customizado para o app. Atualize o registro A/CNAME conforme as
instruções no painel.

## Solução de problemas

- **`AUTH_SECRET` ausente** → defina nas Environment Variables.
- **Erro `ECONNREFUSED` no boot** → `DATABASE_URL` aponta para um host que
  o app não consegue acessar; confirme host e porta no painel.
- **E-mails não saem** → confira `RESEND_API_KEY` e domínio verificado no
  Resend. Sem `REDIS_URL`, o envio é síncrono e qualquer erro aparece nos
  logs da requisição.
- **Build falha por memória** → planos pequenos podem precisar de
  `NODE_OPTIONS=--max-old-space-size=1024` como variável de ambiente.

## Atualizações futuras

A cada push na branch conectada, a Hostinger executa:

```
npm install
npm run build
npm start
```

Se houver novas migrations, rode `npm run db:migrate` manualmente após o
deploy concluir.
