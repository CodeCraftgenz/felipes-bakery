/**
 * FormularioLoginAdmin — Felipe's Bakery
 *
 * Formulário de login do painel administrativo.
 * Client Component — faz signIn com provider 'admin-credentials'.
 */

'use client'

import { useState }       from 'react'
import { signIn }         from 'next-auth/react'
import { useRouter }      from 'next/navigation'
import { useForm }        from 'react-hook-form'
import { zodResolver }    from '@hookform/resolvers/zod'
import { z }              from 'zod'
import { Loader2, Lock }  from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormLogin = z.infer<typeof schema>

export function FormularioLoginAdmin() {
  const router            = useRouter()
  const [erro, setErro]   = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>({ resolver: zodResolver(schema) })

  async function onSubmit(dados: FormLogin) {
    setErro(null)

    const resultado = await signIn('admin-credentials', {
      email:    dados.email,
      password: dados.senha,
      redirect: false,
    })

    if (resultado?.error) {
      setErro('E-mail ou senha incorretos.')
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* E-mail */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-white/70"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          {...register('email')}
          placeholder="admin@felipesbakery.com.br"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Senha */}
      <div>
        <label
          htmlFor="senha"
          className="mb-1.5 block text-sm font-medium text-white/70"
        >
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          {...register('senha')}
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        {errors.senha && (
          <p className="mt-1 text-xs text-red-400">{errors.senha.message}</p>
        )}
      </div>

      {/* Erro geral */}
      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {isSubmitting
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Lock className="h-4 w-4" />
        }
        {isSubmitting ? 'Entrando…' : 'Entrar no painel'}
      </button>
    </form>
  )
}
