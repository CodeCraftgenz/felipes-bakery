/**
 * Queries de Configurações da Loja — Felipe's Bakery
 *
 * Busca as configurações globais da loja (singleton id=1).
 * Usada para exibir o ciclo de pedidos, contato e modo de manutenção.
 * Server-only.
 */

import 'server-only'
import { eq }  from 'drizzle-orm'
import { db }  from '@backend/lib/banco'
import { configuracoes } from '@schema'

// ── Tipo de Retorno ───────────────────────────────────────────
export type ConfiguracoesLoja = {
  nomeLoja:       string
  whatsapp:       string | null
  telefone:       string | null
  emailContato:   string | null
  diaCorte:       number   // 0=Dom ... 6=Sáb
  horaCorte:      number   // 0-23
  diaEntrega:     number
  taxaFrete:      string
  modoManutencao: number
}

// ── Função de Query ───────────────────────────────────────────

/**
 * Retorna as configurações da loja (registro singleton id=1).
 * Em caso de erro retorna configurações padrão para não quebrar a UI.
 */
export async function buscarConfiguracoes(): Promise<ConfiguracoesLoja> {
  try {
    const [config] = await db
      .select()
      .from(configuracoes)
      .where(eq(configuracoes.id, 1))
      .limit(1)

    if (!config) {
      return configuracoesPadrao()
    }

    return {
      nomeLoja:       config.nomeLoja,
      whatsapp:       config.whatsapp,
      telefone:       config.telefone,
      emailContato:   config.emailContato,
      diaCorte:       config.diaCorte,
      horaCorte:      config.horaCorte,
      diaEntrega:     config.diaEntrega,
      taxaFrete:      config.taxaFrete ?? '0.00',
      modoManutencao: config.modoManutencao,
    }
  } catch {
    // Se o banco estiver indisponível, retorna padrão
    return configuracoesPadrao()
  }
}

/** Configurações padrão caso o banco não retorne dados */
function configuracoesPadrao(): ConfiguracoesLoja {
  return {
    nomeLoja:       "Felipe's Bakery",
    whatsapp:       '5516997684430',
    telefone:       '(16) 997 684 430',
    emailContato:   'contato@felipesbakery.com.br',
    diaCorte:       3,   // Quarta-feira
    horaCorte:      23,
    diaEntrega:     5,   // Sexta-feira
    taxaFrete:      '0.00',
    modoManutencao: 0,
  }
}
