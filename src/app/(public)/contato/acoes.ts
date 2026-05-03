/**
 * Server Actions — Página de Contato
 *
 * Recebe submissões do formulário e persiste no banco (tabela contact_messages).
 */

'use server'

import { z }                       from 'zod'
import { criarMensagemContato }    from '@backend/modulos/contato/mutations'

// ── Schema de validação ────────────────────────────────────────
const schemaContato = z.object({
  nome:     z.string().min(2, 'Informe seu nome').max(255),
  email:    z.string().email('E-mail inválido').max(255),
  assunto:  z.string().min(1, 'Selecione um assunto').max(50),
  mensagem: z.string().min(5, 'Escreva uma mensagem mais detalhada').max(2000),
})

export type EstadoFormularioContato =
  | { status: 'inicial' }
  | { status: 'sucesso'; mensagem: string }
  | { status: 'erro';    mensagem: string; erros?: Record<string, string[]> }

/**
 * Server Action para envio do formulário de contato.
 * Compatível com `useActionState` do React 19.
 */
export async function enviarMensagemContato(
  _prev: EstadoFormularioContato,
  formData: FormData,
): Promise<EstadoFormularioContato> {
  const dadosBrutos = {
    nome:     formData.get('nome'),
    email:    formData.get('email'),
    assunto:  formData.get('assunto'),
    mensagem: formData.get('mensagem'),
  }

  const parse = schemaContato.safeParse(dadosBrutos)
  if (!parse.success) {
    return {
      status:   'erro',
      mensagem: 'Verifique os campos preenchidos.',
      erros:    parse.error.flatten().fieldErrors,
    }
  }

  try {
    // Prefixa a mensagem com o assunto para o admin identificar
    const mensagemFormatada = `[${parse.data.assunto}] ${parse.data.mensagem}`

    await criarMensagemContato({
      nome:     parse.data.nome,
      email:    parse.data.email,
      mensagem: mensagemFormatada,
    })

    return {
      status:   'sucesso',
      mensagem: 'Mensagem enviada! Responderemos em até 24 horas.',
    }
  } catch (erro) {
    console.error('[Contato] Erro ao salvar mensagem:', erro)
    return {
      status:   'erro',
      mensagem: 'Não foi possível enviar agora. Tente novamente em instantes.',
    }
  }
}
