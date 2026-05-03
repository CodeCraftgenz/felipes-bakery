/**
 * Conexão com o Banco de Dados — Felipe's Bakery
 *
 * Cria e exporta uma instância singleton do Drizzle ORM conectado ao MySQL.
 * Em desenvolvimento (hot reload do Next.js), reutiliza a mesma conexão
 * para evitar criar múltiplos pools de conexão.
 *
 * Uso:
 *   import { db } from '@backend/lib/banco'
 *   import { produtos, pedidos } from '@backend/lib/banco'
 *
 * A instância `db` só deve ser importada em:
 *   - Server Components
 *   - Route Handlers (API Routes)
 *   - Server Actions
 *   - Scripts de seed/migration
 *
 * NUNCA importar em Client Components — isso exporia as credenciais do banco.
 */

import { drizzle } from 'drizzle-orm/mysql2'
import mysql       from 'mysql2/promise'
import * as schema from '../../../../banco/schema'

// ── Tipagem do singleton global ───────────────────────────
// Necessário para evitar múltiplas conexões no hot reload do Next.js
declare global {
  // eslint-disable-next-line no-var
  var __bancoInstance: ReturnType<typeof drizzle> | undefined
  // eslint-disable-next-line no-var
  var __poolInstance: mysql.Pool | undefined
}

/**
 * Cria o pool de conexões MySQL.
 * Lança erro explícito se DATABASE_URL não estiver configurada.
 */
function criarPool(): mysql.Pool {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      '[Banco] DATABASE_URL não está definida.\n' +
      'Configure a variável no arquivo .env.local'
    )
  }

  return mysql.createPool({
    uri:                url,
    waitForConnections: true,
    connectionLimit:    10,     // máximo de conexões simultâneas
    queueLimit:         0,      // sem limite de fila
    charset:            'utf8mb4',
    timezone:           'Z',    // todas as datas armazenadas em UTC
  })
}

/**
 * Cria a instância do Drizzle ORM com o schema completo.
 * O logger está ativo apenas em desenvolvimento para não poluir os logs de produção.
 */
function criarBanco() {
  const pool = globalThis.__poolInstance ?? criarPool()

  // Em desenvolvimento, reutiliza o pool para evitar múltiplas conexões
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__poolInstance = pool
  }

  return drizzle(pool, {
    schema,
    mode:   'default',
    logger: process.env.NODE_ENV === 'development',
  })
}

/** Instância principal do banco — use esta em todo o projeto */
export const db = globalThis.__bancoInstance ?? criarBanco()

// Salva no global apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalThis.__bancoInstance = db
}

// Re-exporta todos os schemas para conveniência
// Permite: import { db, produtos, pedidos } from '@backend/lib/banco'
export * from '../../../../banco/schema'
