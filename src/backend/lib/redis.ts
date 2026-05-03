/**
 * Cliente Redis — Felipe's Bakery
 *
 * Cria e exporta um singleton do IORedis com suporte a hot-reload do Next.js.
 * Usado para cache de dados, rate limiting e como broker do BullMQ.
 *
 * Comportamento opcional (graceful degradation):
 *   - Se REDIS_URL não estiver definida ou estiver vazia, `redis` será `null`.
 *   - Todos os consumidores devem checar `if (redis)` antes de usar.
 *   - O helper `cacheFetch` faz fallback automático e apenas executa a função
 *     original quando o Redis não está disponível.
 *
 * Uso:
 *   import { redis, cacheFetch } from '@backend/lib/redis'
 *
 *   // Cache simples com TTL de 5 minutos
 *   const produtos = await cacheFetch('produtos:destaque', buscarProdutosDestaque, 300)
 *
 * Variáveis de ambiente necessárias:
 *   REDIS_URL — URL completa de conexão (ex: redis://localhost:6379 ou rediss://user:pass@host:6380)
 *               Se ausente, o app continua funcionando sem cache nem filas.
 *
 * NUNCA importar em Client Components.
 */

import 'server-only'

import Redis     from 'ioredis'
import { criarLogger } from './logger'

// Logger específico para o módulo Redis
const log = criarLogger('redis')

// ── Tipagem do singleton global ───────────────────────────
// Evita múltiplas conexões no hot-reload do Next.js em desenvolvimento
declare global {
  // eslint-disable-next-line no-var
  var __redisInstance: Redis | null | undefined
}

/**
 * Cria a conexão com o Redis.
 * Retorna `null` quando REDIS_URL não está configurada — permite que o app
 * funcione sem Redis (sem cache nem filas) em ambientes onde Redis é opcional
 * (ex: Hostinger Node.js Web App sem Upstash configurado).
 */
function criarCliente(): Redis | null {
  const url = process.env.REDIS_URL?.trim()

  if (!url) {
    log.warn(
      'REDIS_URL não está definida — Redis desabilitado.\n' +
      'O app funcionará sem cache e sem filas BullMQ (envios de e-mail síncronos).\n' +
      'Para habilitar, defina REDIS_URL (ex: rediss://default:TOKEN@HOST:PORT).'
    )
    return null
  }

  const cliente = new Redis(url, {
    // Reconecta automaticamente com backoff exponencial
    retryStrategy(tentativas) {
      if (tentativas > 5) {
        log.error('Redis: número máximo de tentativas de reconexão atingido')
        return null // Para de tentar reconectar
      }
      // Aguarda entre 100ms e 3s antes de cada tentativa
      return Math.min(tentativas * 200, 3000)
    },
    // Silencia erros não tratados (o retryStrategy já lida com falhas)
    lazyConnect:              false,
    enableOfflineQueue:       true,  // enfileira comandos enquanto reconecta
    maxRetriesPerRequest:     3,
    connectTimeout:           10_000, // 10 segundos para conectar
  })

  // Registra eventos de ciclo de vida da conexão
  cliente.on('connect',    () => log.info('Redis conectado'))
  cliente.on('ready',      () => log.debug('Redis pronto para receber comandos'))
  cliente.on('error',      (err) => log.error({ err }, 'Erro na conexão Redis'))
  cliente.on('close',      () => log.warn('Conexão Redis encerrada'))
  cliente.on('reconnecting', () => log.warn('Redis: tentando reconectar...'))

  return cliente
}

/**
 * Instância principal do Redis.
 * Pode ser `null` quando REDIS_URL não está configurada — sempre verifique
 * antes de usar:
 *
 *   if (redis) { await redis.set(...) }
 */
export const redis: Redis | null =
  globalThis.__redisInstance ?? criarCliente()

// Em desenvolvimento, reutiliza a instância para evitar múltiplas conexões
if (process.env.NODE_ENV !== 'production') {
  globalThis.__redisInstance = redis
}

/**
 * Encerra graciosamente a conexão com o Redis.
 * Chame em scripts de seed, workers ou ao desligar o servidor manualmente.
 *
 * @example
 *   process.on('SIGTERM', fecharRedis)
 */
export async function fecharRedis(): Promise<void> {
  if (!redis) return
  try {
    await redis.quit()
    log.info('Conexão Redis encerrada com sucesso')
  } catch (err) {
    log.error({ err }, 'Erro ao encerrar conexão Redis')
  }
}

/**
 * Cache genérico com Redis.
 * Verifica o cache antes de executar `fn`. Se o valor existir, retorna do cache.
 * Caso contrário, executa `fn`, armazena o resultado e o retorna.
 *
 * Se o Redis não estiver disponível (REDIS_URL ausente), simplesmente executa
 * `fn` sem cachear — a aplicação funciona, apenas mais lenta.
 *
 * @param chave        - Chave Redis (ex: 'produtos:destaque', 'config:geral')
 * @param fn           - Função assíncrona que busca o dado original
 * @param ttlSegundos  - Tempo de vida do cache em segundos (padrão: 300 = 5 min)
 *
 * @example
 *   const produtos = await cacheFetch(
 *     'produtos:destaque',
 *     () => db.select().from(produtos).where(eq(produtos.destaque, 1)),
 *     600 // 10 minutos
 *   )
 */
export async function cacheFetch<T>(
  chave: string,
  fn: () => Promise<T>,
  ttlSegundos = 300
): Promise<T> {
  // Sem Redis, vai direto à fonte original (sem cachear)
  if (!redis) {
    return fn()
  }

  try {
    // Tenta buscar o valor em cache
    const valorCacheado = await redis.get(chave)

    if (valorCacheado !== null) {
      log.debug({ chave }, 'Cache hit')
      // Faz o parse do JSON armazenado de volta para o tipo T
      return JSON.parse(valorCacheado) as T
    }

    log.debug({ chave }, 'Cache miss — buscando dado original')
  } catch (err) {
    // Falha no Redis não deve derrubar a requisição — faz fallback para a fn
    log.warn({ err, chave }, 'Erro ao ler cache — usando fallback')
  }

  // Executa a função original para obter o dado
  const valor = await fn()

  try {
    // Armazena no cache com expiração (EX = segundos)
    await redis.set(chave, JSON.stringify(valor), 'EX', ttlSegundos)
    log.debug({ chave, ttlSegundos }, 'Valor armazenado no cache')
  } catch (err) {
    // Falha ao gravar no cache não é crítica — o dado original ainda é retornado
    log.warn({ err, chave }, 'Erro ao gravar no cache')
  }

  return valor
}
