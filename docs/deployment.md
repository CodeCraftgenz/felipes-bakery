# Guia de Deploy — Felipe's Bakery

## Pré-requisitos na VPS (Ubuntu 22.04)

```bash
# Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22 && nvm use 22 && nvm alias default 22

# PM2
npm install -g pm2

# Docker + Docker Compose
curl -fsSL https://get.docker.com | sh

# Nginx
sudo apt install nginx -y

# Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

## Primeiro Deploy

```bash
# 1. Clone o repositório
cd /var/www
git clone git@github.com:seu-usuario/felipes-bakery.git felipesbakery
cd felipesbakery

# 2. Configure variáveis de ambiente
cp .env.example .env.production
nano .env.production  # preencha todos os valores

# 3. Suba MySQL e Redis via Docker
docker compose -f docker-compose.prod.yml up -d

# 4. Instale dependências e build
npm ci
NODE_ENV=production npm run build

# 5. Rode as migrations
npm run db:migrate

# 6. Rode o seed (apenas no primeiro deploy)
NODE_ENV=production npm run db:seed

# 7. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/felipesbakery
sudo ln -s /etc/nginx/sites-available/felipesbakery /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. Obtenha SSL
sudo certbot --nginx -d felipesbakery.com.br -d www.felipesbakery.com.br

# 9. Inicie com PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Siga as instruções para iniciar no boot
```

## Deploy Contínuo (automático via GitHub Actions)

A cada push na branch `main`, o GitHub Actions:
1. Roda lint + typecheck
2. Roda testes unitários
3. Faz build
4. Conecta na VPS via SSH
5. Faz `git pull`, `npm ci`, `npm run build`, `npm run db:migrate`
6. Reload zero-downtime com `pm2 reload felipesbakery`

**Secrets necessários no GitHub:**
- `VPS_HOST` — IP da VPS
- `VPS_USER` — usuário SSH (ex: `ubuntu`)
- `VPS_SSH_KEY` — chave privada SSH
- `DATABASE_URL` — URL do banco de produção
- `NEXTAUTH_SECRET` — segredo JWT
- `NEXTAUTH_URL` — URL pública do site
- `NEXT_PUBLIC_APP_URL` — URL pública
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` — chave pública do MP

## Comandos Úteis

```bash
# Ver status dos processos
pm2 status

# Ver logs em tempo real
pm2 logs felipesbakery

# Reload zero-downtime
pm2 reload felipesbakery --update-env

# Ver uso de memória/CPU
pm2 monit

# Backup manual do banco
docker exec felipesbakery_mysql_prod mysqldump \
  -u bakery_user -p<senha> felipesbakery_prod \
  | gzip > backup_$(date +%Y%m%d).sql.gz
```

## Configuração DNS na Hostinger

| Tipo | Nome | Valor |
|---|---|---|
| A | @ | IP_DA_VPS |
| A | www | IP_DA_VPS |
| CNAME | cdn | seu-bucket.r2.cloudflarestorage.com |

TTL: 3600 (1 hora)
