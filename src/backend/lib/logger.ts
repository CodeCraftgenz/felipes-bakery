/**
 * Logger Singleton — Felipe's Bakery
 *
 * Cria e exporta uma instância do Pino com configuração adaptada ao ambiente:
 *   - Desenvolvimento: saída formatada pelo pino-pretty (legível no terminal)
 *   - Produção: saída JSON estruturada (compatível com ferramentas de log como Loki/Datadog)
 *
 * Uso básico:
 *   import { logger } from '@backend/lib/logger'
 *   logger.info('Servidor iniciado')
 *   logger.error({ err }, 'Falha ao processar pedido')
 *
 * Uso com módulo:
 *   import { criarLogger } from '@backend/lib/logger'
 *   const log = criarLogger('email')
 *   log.info('E-mail enviado com sucesso')
 *
 * Nota: logger.ts não importa 'server-only' pois pode ser usado em edge runtimes
 * e scripts de CLI onde o módulo não está disponível.
 */

import pino from 'pino'

// ── Configuração base do Pino ─────────────────────────────
const eDesenvolvimento = process.env.NODE_ENV !== 'production'

/**
 * Cria a instância principal do logger.
 * Envolto em try/catch para ambientes edge onde pino-pretty pode não estar disponível.
 */
function criarLoggerBase(): pino.Logger {
  try {
    if (eDesenvolvimento) {
      // Modo desenvolvimento: saída colorida e formatada no terminal
      return pino({
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize:         true,
            translateTime:    'SYS:HH:MM:ss',  // horário local legível
            ignore:           'pid,hostname',   // reduz ruído no terminal
            messageFormat:    '[{modulo}] {msg}',
            singleLine:       false,
          },
        },
      })
    }

    // Modo produção: JSON estruturado, nível info em diante
    return pino({
      level: 'info',
      // Adiciona timestamp em formato ISO ao JSON de produção
      timestamp: pino.stdTimeFunctions.isoTime,
    })
  } catch {
    // Fallback para ambientes edge ou quando pino-pretty não está instalado
    // Usa o pino sem transport — apenas JSON simples
    return pino({ level: eDesenvolvimento ? 'debug' : 'info' })
  }
}

/** Instância principal do logger — use esta na maioria dos casos */
export const logger = criarLoggerBase()

/**
 * Cria um logger filho com o nome do módulo como label.
 * Facilita filtrar logs por origem na produção.
 *
 * @param modulo - Nome do módulo ou serviço (ex: 'email', 'pedidos', 'redis')
 *
 * @example
 *   const log = criarLogger('carrinho')
 *   log.info({ clienteId: 42 }, 'Item adicionado ao carrinho')
 *   // Saída: [carrinho] Item adicionado ao carrinho { clienteId: 42 }
 */
export function criarLogger(modulo: string): pino.Logger {
  // Child logger herda todas as configurações do pai e adiciona o campo 'modulo'
  return logger.child({ modulo })
}
