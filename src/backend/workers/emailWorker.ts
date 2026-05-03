/**
 * Worker de E-mail — Felipe's Bakery
 *
 * Processa os jobs da fila `filaEmail` e chama a função de envio
 * correta com base no campo `tipo` do job.
 *
 * Ciclo de vida:
 *   1. O worker ouve a fila 'email' no Redis
 *   2. Para cada job recebido, identifica o tipo e chama a função correspondente
 *   3. Em caso de falha, o BullMQ recoloca o job na fila (até `attempts` tentativas)
 *   4. Jobs com falha definitiva são movidos para a Dead Letter Queue do BullMQ
 *
 * Para iniciar o worker (ex: em src/backend/workers/index.ts ou um script separado):
 *   import { iniciarWorkerEmail } from '@backend/workers/emailWorker'
 *   iniciarWorkerEmail()
 *
 * Para rodar em produção com PM2:
 *   pm2 start ecosystem.config.js --only email-worker
 *
 * NUNCA importar em Client Components.
 */

import 'server-only'

import { Worker, type Job }           from 'bullmq'
import { redis }                      from '../lib/redis'
import { criarLogger }                from '../lib/logger'
import {
  enviarEmailPedidoConfirmado,
  enviarEmailBoasVindas,
}                                     from '../lib/email'
import type { DadosJobEmail }         from '../lib/filas'

// Logger específico para o worker de e-mail
const log = criarLogger('worker-email')

/**
 * Processa um job de e-mail individual.
 * Lança erro em caso de falha para que o BullMQ possa fazer retry.
 *
 * @param job - Job BullMQ com dados tipados como DadosJobEmail
 */
async function processarJobEmail(job: Job<DadosJobEmail>): Promise<void> {
  const { tipo, destinatario, nome, dados } = job.data

  log.info(
    { jobId: job.id, tipo, destinatario, tentativa: job.attemptsMade + 1 },
    'Processando job de e-mail'
  )

  switch (tipo) {
    case 'pedido_confirmado': {
      // Extrai os campos esperados pelo template a partir de `dados`
      await enviarEmailPedidoConfirmado({
        para:         destinatario,
        nome,
        numeroPedido: String(dados.numeroPedido ?? ''),
        itens:        (dados.itens as Array<{
          nome:          string
          quantidade:    number
          precoUnitario: number
        }>) ?? [],
        total:        Number(dados.total ?? 0),
        dataEntrega:  String(dados.dataEntrega ?? ''),
      })
      break
    }

    case 'pedido_pronto': {
      // Reutiliza o template de confirmação com adaptação da mensagem
      // Fase futura: criar template dedicado de "pedido pronto para retirada"
      await enviarEmailPedidoConfirmado({
        para:         destinatario,
        nome,
        numeroPedido: String(dados.numeroPedido ?? ''),
        itens:        (dados.itens as Array<{
          nome:          string
          quantidade:    number
          precoUnitario: number
        }>) ?? [],
        total:        Number(dados.total ?? 0),
        dataEntrega:  String(dados.dataEntrega ?? 'Pronto para retirada!'),
      })
      break
    }

    case 'boas_vindas': {
      await enviarEmailBoasVindas({
        para:  destinatario,
        nome,
      })
      break
    }

    default: {
      // Garante em tempo de compilação que todos os tipos são tratados
      const _tipoExaustivo: never = tipo
      log.error(
        { jobId: job.id, tipo: _tipoExaustivo },
        'Tipo de e-mail desconhecido — job ignorado'
      )
      throw new Error(`[EmailWorker] Tipo de e-mail não reconhecido: ${tipo}`)
    }
  }

  log.info(
    { jobId: job.id, tipo, destinatario },
    'Job de e-mail processado com sucesso'
  )
}

/**
 * Inicia o worker que processa a fila de e-mails.
 * Deve ser chamado uma única vez na inicialização do servidor/processo worker.
 *
 * Retorna `null` quando o Redis não está disponível (REDIS_URL ausente) —
 * nesse caso os e-mails são enviados de forma síncrona pelo `adicionarJobEmail`
 * em filas.ts e não há worker para iniciar.
 *
 * @returns Instância do Worker (útil para desligar graciosamente) ou `null`.
 *
 * @example
 *   // Em src/backend/workers/index.ts ou script PM2:
 *   const worker = iniciarWorkerEmail()
 *
 *   process.on('SIGTERM', async () => {
 *     await worker?.close()
 *   })
 */
export function iniciarWorkerEmail(): Worker<DadosJobEmail> | null {
  if (!redis) {
    log.warn(
      'Worker de e-mail não iniciado — Redis indisponível.\n' +
      'E-mails serão enviados de forma síncrona pelo adicionarJobEmail().'
    )
    return null
  }

  const worker = new Worker<DadosJobEmail>(
    'email',              // nome da fila — deve coincidir com filaEmail em filas.ts
    processarJobEmail,
    {
      connection: redis,  // reutiliza a conexão singleton do Redis
      concurrency: 5,     // processa até 5 e-mails em paralelo
      // Garante que o worker não derrube o Redis com muitas conexões simultâneas
      limiter: {
        max:      10,     // máximo de jobs por intervalo
        duration: 1_000,  // intervalo em milissegundos (1 segundo)
      },
    }
  )

  // ── Eventos do worker ─────────────────────────────────
  worker.on('ready', () => {
    log.info('Worker de e-mail iniciado e aguardando jobs')
  })

  worker.on('completed', (job) => {
    log.info(
      { jobId: job.id, tipo: job.data.tipo },
      'Job de e-mail concluído'
    )
  })

  worker.on('failed', (job, err) => {
    log.error(
      {
        jobId:     job?.id,
        tipo:      job?.data?.tipo,
        tentativa: job?.attemptsMade,
        err,
      },
      'Job de e-mail falhou'
    )
  })

  worker.on('error', (err) => {
    // Erro interno do worker (ex: desconexão do Redis)
    log.error({ err }, 'Erro interno no worker de e-mail')
  })

  worker.on('stalled', (jobId) => {
    // Job travado (ex: processo morreu durante o processamento)
    log.warn({ jobId }, 'Job de e-mail travado — será reprocessado')
  })

  return worker
}
