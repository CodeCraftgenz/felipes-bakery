/**
 * Configuração do Drizzle ORM — Felipe's Bakery
 *
 * Define onde estão os schemas, para onde gerar as migrations
 * e como conectar ao banco MySQL.
 *
 * Comandos disponíveis:
 *   npm run db:generate  → gera migration a partir dos schemas
 *   npm run db:migrate   → aplica migrations pendentes no banco
 *   npm run db:push      → aplica schema diretamente (só em dev)
 *   npm run db:studio    → abre interface visual do banco
 */

import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// Carrega variáveis do .env.local em desenvolvimento
config({ path: '.env.local' })

export default {
  // Caminho para os schemas (entidades do banco)
  schema: './banco/schema/index.ts',

  // Pasta onde as migrations serão geradas
  out: './banco/migrations',

  // Dialeto do banco — MySQL 8.0
  dialect: 'mysql',

  // Credenciais de conexão via DATABASE_URL
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Mostra queries SQL no console durante desenvolvimento
  verbose: process.env.NODE_ENV === 'development',

  // Exige confirmação antes de operações destrutivas
  strict: true,
} satisfies Config
