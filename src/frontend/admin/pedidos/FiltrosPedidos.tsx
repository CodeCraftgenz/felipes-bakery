/**
 * FiltrosPedidos — Felipe's Bakery Admin
 *
 * Abas de status + campo de busca por número/cliente.
 * Client Component — atualiza URL com searchParams.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search }                                  from 'lucide-react'
import { cn }                                      from '@compartilhado/utils'
import { Entrada }                                 from '@frontend/compartilhado/ui'

const ABAS = [
  { valor: '',                    rotulo: 'Todos'        },
  { valor: 'aguardando_pagamento', rotulo: 'Aguardando'  },
  { valor: 'confirmado',          rotulo: 'Confirmado'   },
  { valor: 'em_producao',         rotulo: 'Em Produção'  },
  { valor: 'pronto',              rotulo: 'Pronto'       },
  { valor: 'entregue',            rotulo: 'Entregue'     },
  { valor: 'cancelado',           rotulo: 'Cancelado'    },
]

export function FiltrosPedidos() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const statusAtual = params.get('status') ?? ''

  function atualizarParam(chave: string, valor: string) {
    const p = new URLSearchParams(params.toString())
    if (valor) p.set(chave, valor)
    else       p.delete(chave)
    p.delete('pagina')
    router.push(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="space-y-3">
      {/* Abas de status */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {ABAS.map((aba) => (
          <button
            key={aba.valor}
            type="button"
            onClick={() => atualizarParam('status', aba.valor)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              statusAtual === aba.valor
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {/* Busca */}
      <Entrada
        iconeEsquerda={<Search className="h-4 w-4" />}
        placeholder="Buscar por número do pedido ou nome do cliente..."
        defaultValue={params.get('busca') ?? ''}
        onChange={(e) => atualizarParam('busca', e.target.value)}
        className="w-full sm:w-80"
      />
    </div>
  )
}
