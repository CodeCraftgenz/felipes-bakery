/**
 * Formulário de Contato — Felipe's Bakery
 *
 * Client Component que envia os dados via Server Action e exibe feedback.
 * Usa useFormState + useFormStatus (React 18) para gerenciar o ciclo de envio.
 */

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link                            from 'next/link'
import {
  enviarMensagemContato,
  type EstadoFormularioContato,
} from './acoes'

const ESTADO_INICIAL: EstadoFormularioContato = { status: 'inicial' }

// Botão separado para acessar o status do form via useFormStatus (React 18)
function BotaoEnviar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-500 px-6 py-4 font-semibold text-white shadow-card transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Enviando...' : 'Enviar Mensagem'}
    </button>
  )
}

export function FormularioContato() {
  const [estado, formAction] = useFormState(
    enviarMensagemContato,
    ESTADO_INICIAL,
  )

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-cream-300 bg-white p-8 shadow-card"
    >
      {/* Nome */}
      <div>
        <label
          htmlFor="nome"
          className="mb-1.5 block text-sm font-semibold text-stone-700"
        >
          Nome <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          placeholder="Seu nome completo"
          className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-stone-800 placeholder-stone-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {estado.status === 'erro' && estado.erros?.nome && (
          <p className="mt-1 text-xs text-terracotta-600">{estado.erros.nome[0]}</p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-semibold text-stone-700"
        >
          E-mail <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="seu@email.com.br"
          className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-stone-800 placeholder-stone-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {estado.status === 'erro' && estado.erros?.email && (
          <p className="mt-1 text-xs text-terracotta-600">{estado.erros.email[0]}</p>
        )}
      </div>

      {/* Assunto */}
      <div>
        <label
          htmlFor="assunto"
          className="mb-1.5 block text-sm font-semibold text-stone-700"
        >
          Assunto <span className="text-terracotta-500">*</span>
        </label>
        <select
          id="assunto"
          name="assunto"
          required
          defaultValue=""
          className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-stone-800 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="" disabled>Selecione um assunto</option>
          <option value="pedido">Pedido</option>
          <option value="duvida">Dúvida</option>
          <option value="sugestao">Sugestão</option>
          <option value="parceria">Parceria</option>
        </select>
      </div>

      {/* Mensagem */}
      <div>
        <label
          htmlFor="mensagem"
          className="mb-1.5 block text-sm font-semibold text-stone-700"
        >
          Mensagem <span className="text-terracotta-500">*</span>
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          required
          rows={5}
          placeholder="Escreva sua mensagem aqui..."
          className="w-full resize-none rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-stone-800 placeholder-stone-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {estado.status === 'erro' && estado.erros?.mensagem && (
          <p className="mt-1 text-xs text-terracotta-600">{estado.erros.mensagem[0]}</p>
        )}
      </div>

      {/* Aviso de resposta */}
      <p className="text-xs text-stone-500">
        Respondemos em até 24 horas. Para urgências, prefira o{' '}
        <Link
          href="https://wa.me/5516997684430"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          WhatsApp
        </Link>
        .
      </p>

      {/* Feedback de envio */}
      {estado.status === 'sucesso' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {estado.mensagem}
        </div>
      )}
      {estado.status === 'erro' && !estado.erros && (
        <div className="rounded-xl border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-800">
          {estado.mensagem}
        </div>
      )}

      {/* Botão de envio */}
      <BotaoEnviar />
    </form>
  )
}
