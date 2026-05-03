/**
 * Mutations de Contato — Felipe's Bakery
 *
 * Persiste mensagens enviadas pelo formulário de contato do site público.
 * Server-only.
 */

import 'server-only'
import { db }                from '@backend/lib/banco'
import { mensagensContato }  from '@schema'

export interface NovaMensagemContato {
  nome:     string
  email:    string
  telefone?: string | null
  mensagem: string
}

/**
 * Cria uma nova mensagem de contato com status 'nova'.
 */
export async function criarMensagemContato(dados: NovaMensagemContato) {
  const [inserido] = await db.insert(mensagensContato).values({
    nome:     dados.nome,
    email:    dados.email,
    telefone: dados.telefone ?? null,
    mensagem: dados.mensagem,
    status:   'nova',
  })

  return { id: (inserido as any).insertId as number }
}
