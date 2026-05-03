import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../../../drizzle/schema'

// ─── Singleton de conexão ────────────────────────────────
// Em Next.js (dev com hot reload), evita criar múltiplos pools
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined
  // eslint-disable-next-line no-var
  var __pool: mysql.Pool | undefined
}

function createPool() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('[DB] DATABASE_URL não definida. Configure o arquivo .env.local')
  }

  return mysql.createPool({
    uri:              url,
    waitForConnections: true,
    connectionLimit:  10,
    queueLimit:       0,
    charset:          'utf8mb4',
    timezone:         'Z', // UTC — datas sempre em UTC no banco
  })
}

function createDb() {
  const pool = globalThis.__pool ?? createPool()

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__pool = pool
  }

  return drizzle(pool, {
    schema,
    mode: 'default',
    logger: process.env.NODE_ENV === 'development',
  })
}

export const db = globalThis.__db ?? createDb()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db
}

// Re-exporta o schema para conveniência
export * from '../../../drizzle/schema'
