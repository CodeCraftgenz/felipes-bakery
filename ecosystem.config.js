/**
 * PM2 Ecosystem Config — Felipe's Bakery
 * Uso em produção: pm2 start ecosystem.config.js
 * Uso para reload: pm2 reload felipesbakery --update-env
 */

module.exports = {
  apps: [
    {
      name:         'felipesbakery',
      script:       '.next/standalone/server.js',
      cwd:          '/var/www/felipesbakery',

      // Instâncias — 'max' usa todos os cores disponíveis
      // Para VPS com 2 vCPUs, usar 2
      instances:    2,
      exec_mode:    'cluster',

      // Variáveis de ambiente
      env_production: {
        NODE_ENV:  'production',
        PORT:      3000,
        HOSTNAME:  '0.0.0.0',
      },

      // Restart automático
      autorestart:     true,
      watch:           false,
      max_memory_restart: '512M',

      // Logs
      log_file:        '/var/log/pm2/felipesbakery.log',
      out_file:        '/var/log/pm2/felipesbakery-out.log',
      error_file:      '/var/log/pm2/felipesbakery-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,

      // Graceful shutdown
      kill_timeout:    5000,
      listen_timeout:  10000,

      // Zero-downtime reload
      wait_ready:      true,
      max_restarts:    10,
      restart_delay:   4000,
    },
  ],
}
