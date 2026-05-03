/**
 * Configuração do PM2 — Felipe's Bakery
 *
 * PM2 gerencia o processo do Next.js em produção:
 *   - Modo cluster: usa todos os núcleos da CPU
 *   - Reinicia automaticamente em caso de crash
 *   - Zero downtime ao fazer deploy (reload gracioso)
 *   - Logs centralizados com rotação automática
 *
 * Comandos úteis:
 *   pm2 start ecosystem.config.js   → inicia a aplicação
 *   pm2 reload felipes-bakery        → reload sem downtime (usar no deploy)
 *   pm2 stop felipes-bakery          → para a aplicação
 *   pm2 logs felipes-bakery          → acompanha logs em tempo real
 *   pm2 monit                        → monitor de CPU/memória
 *   pm2 save                         → salva configuração para reinício automático
 *   pm2 startup                      → configura PM2 para iniciar no boot do servidor
 */

module.exports = {
  apps: [
    {
      // ── Identificação ───────────────────────────────────────
      name: 'felipes-bakery',
      script: 'node_modules/.bin/next',
      args: 'start',

      // ── Cluster Mode ────────────────────────────────────────
      // 'max' usa todos os núcleos disponíveis do servidor VPS
      // Para VPS de 2 núcleos, use 2; para 4 núcleos, use 4 ou 'max'
      instances: 2,
      exec_mode: 'cluster',

      // ── Variáveis de Ambiente ────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // ── Reinicialização Automática ───────────────────────────
      autorestart: true,           // Reinicia em caso de crash
      watch: false,                // NÃO observa arquivos em produção
      max_memory_restart: '512M',  // Reinicia se usar mais de 512MB de RAM

      // ── Delay entre Reinicializações ─────────────────────────
      // Evita loops de crash rápidos (exponential backoff)
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10,

      // ── Configuração de Logs ─────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/felipes-bakery-error.log',
      out_file: '/var/log/pm2/felipes-bakery-out.log',
      merge_logs: true,            // Combina logs de todos os workers

      // ── Graceful Shutdown ────────────────────────────────────
      // Aguarda 5s para terminar requisições em andamento antes de parar
      kill_timeout: 5000,
      listen_timeout: 8000,        // Aguarda Node.js ficar pronto para aceitar conexões
    },
  ],

  // ── Configuração de Deploy ─────────────────────────────────
  // Usado pelo GitHub Actions para fazer deploy via SSH
  deploy: {
    production: {
      user: 'deploy',
      host: process.env.VPS_HOST || 'felipesbakery.com.br',
      ref: 'origin/main',
      repo: 'git@github.com:SEU_USUARIO/felipes-bakery.git',
      path: '/var/www/felipes-bakery',
      'pre-deploy-local': '',
      'post-deploy': [
        'npm ci --omit=dev',
        'npm run db:migrate',       // Aplica migrations pendentes
        'npm run build',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save',
      ].join(' && '),
      'pre-setup': '',
    },
  },
}
