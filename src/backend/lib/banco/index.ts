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
 * Aceita DATABASE_URL (string completa) ou variáveis individuais
 * DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 *
 * A checagem é feita em runtime (no primeiro uso), não no nível de módulo,
 * para que o servidor inicie mesmo sem banco configurado.
 */
function criarPool(): mysql.Pool {
  const url  = process.env.DATABASE_URL
  const host = process.env.DB_HOST
  const user = process.env.DB_USER
  const pass = process.env.DB_PASSWORD
  const name = process.env.DB_NAME

  const opcoes: mysql.PoolOptions = {
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4',
    timezone:           'Z',
  }

  let pool: mysql.Pool

  if (url) {
    pool = mysql.createPool({ ...opcoes, uri: url })
  } else if (host && user && pass && name) {
    pool = mysql.createPool({
      ...opcoes,
      host,
      port:     Number(process.env.DB_PORT ?? 3306),
      user,
      password: pass,
      database: name,
    })
  } else {
    throw new Error(
      '[Banco] Configuração do banco ausente.\n' +
      'Defina DATABASE_URL  OU  DB_HOST + DB_USER + DB_PASSWORD + DB_NAME'
    )
  }

  // Listener obrigatório: sem ele, erros de conexão MySQL viram exceções
  // não tratadas que matam o processo Node.js (resulta em 503 na Hostinger).
  // Cast para EventEmitter porque os tipos do mysql2 não declaram 'error' no Pool,
  // mas o evento existe em runtime (node-mysql2 herda de EventEmitter).
  ;(pool as unknown as NodeJS.EventEmitter).on('error', (err: Error) => {
    console.error('[Banco] Erro no pool MySQL (não fatal):', err.message)
  })

  return pool
}

/**
 * Cria a instância do Drizzle ORM com o schema completo.
 * O logger está ativo apenas em desenvolvimento para não poluir os logs de produção.
 */
function criarBanco() {
  const pool = globalThis.__poolInstance ?? criarPool()

  // Reutiliza o pool em qualquer ambiente para evitar múltiplas conexões
  globalThis.__poolInstance = pool

  return drizzle(pool, {
    schema,
    mode:   'default',
    logger: process.env.NODE_ENV === 'development',
  })
}

/**
 * Retorna a instância singleton do banco, criando-a sob demanda.
 * Mantém a inicialização preguiçosa para o servidor não cair na hora de
 * importar este módulo quando DATABASE_URL ainda não está definida — cenário
 * comum em PaaS como Hostinger Node.js Web App durante o primeiro deploy.
 */
function obterBanco(): ReturnType<typeof drizzle> {
  if (globalThis.__bancoInstance) return globalThis.__bancoInstance
  const instancia = criarBanco()
  globalThis.__bancoInstance = instancia
  return instancia
}

/**
 * Instância principal do banco — use esta em todo o projeto.
 *
 * É um Proxy que adia a criação real da conexão até o primeiro acesso a
 * qualquer propriedade/método (por exemplo `db.select(...)`). Isso garante
 * que importar este módulo nunca derrube o processo, mesmo sem variáveis
 * de ambiente configuradas — o erro de configuração aparece apenas quando
 * uma requisição efetivamente tenta usar o banco.
 */
export const db: ReturnType<typeof drizzle> = new Proxy(
  {} as ReturnType<typeof drizzle>,
  {
    get(_alvo, propriedade, receptor) {
      const instancia = obterBanco()
      const valor = Reflect.get(instancia as object, propriedade, receptor)
      // Faz bind quando o valor é função para preservar o `this` correto
      return typeof valor === 'function' ? valor.bind(instancia) : valor
    },
  },
)

// Re-exporta todos os schemas para conveniência
// Permite: import { db, produtos, pedidos } from '@backend/lib/banco'
export * from '../../../../banco/schema'
