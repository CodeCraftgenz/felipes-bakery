/**
 * Filas de Processamento Assíncrono — Felipe's Bakery
 *
 * Configura as filas BullMQ para tarefas que não devem bloquear a requisição HTTP:
 *   - filaEmail:        envio de e-mails transacionais (confirmação, pronto para retirada, boas-vindas)
 *   - filaNotificacao:  notificações WhatsApp e push (placeholder para implementação futura)
 *
 * O BullMQ usa Redis como broker. A conexão é reutilizada do módulo redis.ts
 * para evitar múltiplas conexões simultâneas ao Redis.
 *
 * Comportamento opcional (graceful degradation):
 *   - Se REDIS_URL não estiver definida, as filas serão `null` e
 *     `adicionarJobEmail` enviará o e-mail de forma SÍNCRONA dentro do
 *     próprio fluxo da requisição (mais lento, mas funciona em hostings
 *     gerenciados sem Redis disponível, como Hostinger Node.js Web App).
 *
 * Uso:
 *   import { adicionarJobEmail } from '@backend/lib/filas'
 *
 *   await adicionarJobEmail({
 *     tipo:        'pedido_confirmado',
 *     destinatario: cliente.email,
 *     nome:         cliente.nome,
 *     dados:        { numeroPedido, itens, total, dataEntrega },
 *   })
 *
 * NUNCA importar em Client Components.
 */

import 'server-only'

import { Queue }     from 'bullmq'
import { redis }     from './redis'
import { criarLogger } from './logger'

// Logger específico para o módulo de filas
const log = criarLogger('filas')

// ── Tipos dos dados dos jobs ──────────────────────────────

/**
 * Dados obrigatórios para um job de envio de e-mail.
 * O campo `tipo` determina qual template será renderizado pelo worker.
 */
export type DadosJobEmail = {
  /** Tipo do e-mail — determina qual template e assunto usar */
  tipo: 'pedido_confirmado' | 'pedido_pronto' | 'boas_vindas'
  /** Endereço de destino do e-mail */
  destinatario: string
  /** Nome do cliente para personalização do template */
  nome: string
  /** Dados adicionais específicos de cada tipo de e-mail */
  dados: Record<string, unknown>
}

/**
 * Dados para jobs de notificação WhatsApp/push.
 * Implementação completa será feita em fase futura.
 */
export type DadosJobNotificacao = {
  /** Canal de envio da notificação */
  canal: 'whatsapp' | 'push'
  /** Identificador do destinatário (número de telefone ou token push) */
  destinatario: string
  /** Mensagem a ser enviada */
  mensagem: string
  /** Metadados opcionais para rastreamento */
  metadados?: Record<string, unknown>
}

// ── Definição das filas ───────────────────────────────────
// As filas só existem quando há Redis disponível. Caso contrário,
// `filaEmail`/`filaNotificacao` serão `null` e o helper de enfileiramento
// fará fallback síncrono.

/**
 * Fila de e-mails transacionais.
 * `null` quando REDIS_URL não está configurada.
 * Processada pelo emailWorker.ts com tentativas automáticas em caso de falha.
 */
export const filaEmail: Queue<DadosJobEmail> | null = redis
  ? new Queue<DadosJobEmail>('email', {
      connection: redis,
      defaultJobOptions: {
        // Tenta enviar até 3 vezes antes de mover para fila de falhas
        attempts: 3,
        backoff: {
          type:  'exponential',
          delay: 2_000, // começa com 2s, depois 4s, 8s...
        },
        // Remove jobs bem-sucedidos após 24h (evita crescimento infinito do Redis)
        removeOnComplete: { age: 86_400 },
        // Mantém os últimos 100 jobs com falha para diagnóstico
        removeOnFail: { count: 100 },
      },
    })
  : null

/**
 * Fila de notificações WhatsApp e push.
 * `null` quando REDIS_URL não está configurada.
 * Placeholder — worker a ser implementado em fase futura.
 */
export const filaNotificacao: Queue<DadosJobNotificacao> | null = redis
  ? new Queue<DadosJobNotificacao>('notificacao', {
      connection: redis,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type:  'fixed',
          delay: 5_000, // aguarda 5s entre tentativas
        },
        removeOnComplete: { age: 86_400 },
        removeOnFail:     { count: 50 },
      },
    })
  : null

// Registra as filas criadas no log de inicialização
if (filaEmail || filaNotificacao) {
  log.info({ filas: ['email', 'notificacao'] }, 'Filas BullMQ inicializadas')
} else {
  log.warn(
    'Filas BullMQ desabilitadas (Redis indisponível) — e-mails serão enviados de forma síncrona'
  )
}

// ── Helpers de enfileiramento ─────────────────────────────

/**
 * Envia um e-mail de forma síncrona, sem passar pela fila BullMQ.
 * Usado como fallback quando o Redis não está disponível.
 * Erros são logados mas não relançados — não derrubar o fluxo principal.
 */
async function enviarEmailSincrono(dados: DadosJobEmail): Promise<void> {
  // Import dinâmico para evitar dependência circular (filas.ts → email.ts → ...)
  const { enviarEmailPedidoConfirmado, enviarEmailBoasVindas } = await import('./email')

  try {
    switch (dados.tipo) {
      case 'pedido_confirmado':
      case 'pedido_pronto': {
        await enviarEmailPedidoConfirmado({
          para:         dados.destinatario,
          nome:         dados.nome,
          numeroPedido: String(dados.dados.numeroPedido ?? ''),
          itens:        (dados.dados.itens as Array<{
            nome:          string
            quantidade:    number
            precoUnitario: number
          }>) ?? [],
          total:        Number(dados.dados.total ?? 0),
          dataEntrega:  String(
            dados.dados.dataEntrega ??
            (dados.tipo === 'pedido_pronto' ? 'Pronto para retirada!' : '')
          ),
        })
        break
      }

      case 'boas_vindas': {
        await enviarEmailBoasVindas({
          para: dados.destinatario,
          nome: dados.nome,
        })
        break
      }
    }

    log.info(
      { tipo: dados.tipo, destinatario: dados.destinatario },
      'E-mail enviado de forma síncrona (Redis indisponível)'
    )
  } catch (err) {
    // Em modo síncrono, falha ao enviar e-mail não deve derrubar o fluxo principal
    log.error(
      { err, tipo: dados.tipo, destinatario: dados.destinatario },
      'Erro ao enviar e-mail síncrono — ignorado para não bloquear a requisição'
    )
  }
}

/**
 * Adiciona um job de e-mail na fila para processamento assíncrono.
 * O nome do job é o próprio `tipo` para facilitar o monitoramento no BullMQ Board.
 *
 * Se o Redis não estiver disponível, envia o e-mail de forma síncrona como
 * fallback — a requisição fica um pouco mais lenta, mas o e-mail é entregue.
 *
 * @param dados - Dados do job conforme interface DadosJobEmail
 *
 * @example
 *   await adicionarJobEmail({
 *     tipo:         'boas_vindas',
 *     destinatario: 'joao@email.com',
 *     nome:         'João',
 *     dados:        {},
 *   })
 */
export async function adicionarJobEmail(dados: DadosJobEmail): Promise<void> {
  // Sem fila → envia síncrono e retorna
  if (!filaEmail) {
    await enviarEmailSincrono(dados)
    return
  }

  try {
    const job = await filaEmail.add(dados.tipo, dados)
    log.info(
      { jobId: job.id, tipo: dados.tipo, destinatario: dados.destinatario },
      'Job de e-mail adicionado à fila'
    )
  } catch (err) {
    // Falha ao enfileirar não deve derrubar o fluxo principal — apenas loga
    log.error(
      { err, tipo: dados.tipo, destinatario: dados.destinatario },
      'Erro ao adicionar job de e-mail na fila'
    )
    // Re-lança para que o chamador possa decidir se é crítico
    throw err
  }
}
