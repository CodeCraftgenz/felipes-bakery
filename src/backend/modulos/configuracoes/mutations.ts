/**
 * Mutations das Configurações da Loja — Felipe's Bakery
 *
 * Atualiza o registro singleton (id=1) de configuracoes_loja.
 * Server-only.
 */

import 'server-only'
import { eq }  from 'drizzle-orm'
import { db }  from '@backend/lib/banco'
import { configuracoes } from '@schema'

export interface AtualizarConfigInput {
  nomeLoja?:       string
  whatsapp?:       string | null
  telefone?:       string | null
  emailContato?:   string | null
  diaCorte?:       number   // 0=Dom ... 6=Sáb
  horaCorte?:      number   // 0-23
  diaEntrega?:     number
  taxaFrete?:      string
  modoManutencao?: 0 | 1
}

/**
 * Atualiza a linha singleton de configurações da loja.
 * Cria o registro se não existir (upsert manual).
 */
export async function atualizarConfiguracoes(dados: AtualizarConfigInput) {
  const [existente] = await db
    .select({ id: configuracoes.id })
    .from(configuracoes)
    .where(eq(configuracoes.id, 1))
    .limit(1)

  if (!existente) {
    // Cria o registro com os dados informados + defaults
    await db.insert(configuracoes).values({
      id:             1,
      nomeLoja:       dados.nomeLoja      ?? "Felipe's Bakery",
      whatsapp:       dados.whatsapp      ?? null,
      telefone:       dados.telefone      ?? null,
      emailContato:   dados.emailContato  ?? null,
      diaCorte:       dados.diaCorte      ?? 3,
      horaCorte:      dados.horaCorte     ?? 23,
      diaEntrega:     dados.diaEntrega    ?? 5,
      taxaFrete:      dados.taxaFrete     ?? '0.00',
      modoManutencao: dados.modoManutencao ?? 0,
    })
    return
  }

  await db
    .update(configuracoes)
    .set(dados as Record<string, unknown>)
    .where(eq(configuracoes.id, 1))
}
