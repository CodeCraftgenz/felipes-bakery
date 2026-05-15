/**
 * Rate Limiting — Felipe's Bakery
 *
 * Proteção contra abuso nas rotas críticas (criação de pedidos, validação de cupons).
 * Usa @upstash/ratelimit com Redis REST se as variáveis estiverem configuradas.
 * Sem as variáveis, aceita todas as requisições (graceful degradation para dev/staging).
 *
 * Configurar em produção:
 *   UPSTASH_REDIS_REST_URL=https://...
 *   UPSTASH_REDIS_REST_TOKEN=...
 */

import 'server-only'
import type { NextRequest } from 'next/server'

// Tipo mínimo compatível com o resultado do Ratelimit
type CheckResult = { success: boolean; limit: number; remaining: number; reset: number }

// Instância lazy — inicializada apenas quando as variáveis estiverem presentes
let _limiterPedidos:  { limit: (key: string) => Promise<CheckResult> } | null = null
let _limiterCupons:   { limit: (key: string) => Promise<CheckResult> } | null = null
let _inicializado = false

function obterLimiters() {
  if (_inicializado) return { pedidos: _limiterPedidos, cupons: _limiterCupons }
  _inicializado = true

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[rate-limit] Upstash não configurado — rate limiting desativado')
    }
    return { pedidos: null, cupons: null }
  }

  try {
    // Importação dinâmica para evitar erro de build sem as variáveis
    const { Ratelimit } = require('@upstash/ratelimit')
    const { Redis }     = require('@upstash/redis')

    const redis = new Redis({ url, token })

    _limiterPedidos = new Ratelimit({
      redis,
      limiter:    Ratelimit.slidingWindow(10, '1 m'),  // 10 pedidos/min por IP
      analytics:  false,
      prefix:     'rl:pedidos',
    })

    _limiterCupons = new Ratelimit({
      redis,
      limiter:    Ratelimit.slidingWindow(20, '1 m'),  // 20 validações/min por IP
      analytics:  false,
      prefix:     'rl:cupons',
    })
  } catch (e) {
    console.error('[rate-limit] Falha ao inicializar Upstash:', e)
  }

  return { pedidos: _limiterPedidos, cupons: _limiterCupons }
}

/** Extrai o IP real da requisição (considera Nginx reverse proxy) */
function obterIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonimo'
  )
}

/**
 * Verifica o rate limit para a rota de pedidos.
 * Retorna { bloqueado: true } se o IP excedeu o limite.
 */
export async function checarLimitePedidos(req: NextRequest): Promise<{ bloqueado: boolean }> {
  const { pedidos } = obterLimiters()
  if (!pedidos) return { bloqueado: false }

  const ip        = obterIp(req)
  const resultado = await pedidos.limit(ip)
  return { bloqueado: !resultado.success }
}

/**
 * Verifica o rate limit para a rota de validação de cupons.
 */
export async function checarLimiteCupons(req: NextRequest): Promise<{ bloqueado: boolean }> {
  const { cupons } = obterLimiters()
  if (!cupons) return { bloqueado: false }

  const ip        = obterIp(req)
  const resultado = await cupons.limit(ip)
  return { bloqueado: !resultado.success }
}
