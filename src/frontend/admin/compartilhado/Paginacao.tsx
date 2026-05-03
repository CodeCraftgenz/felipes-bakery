/**
 * Paginacao — Felipe's Bakery Admin
 *
 * Controles de navegação de páginas reutilizados em todas as listagens admin.
 * Client Component — atualiza o parâmetro `pagina` na URL.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight }               from 'lucide-react'
import { Botao }                                   from '@frontend/compartilhado/ui'
import { cn }                                      from '@compartilhado/utils'

interface PaginacaoProps {
  paginaAtual:   number
  totalPaginas:  number
  total:         number
  porPagina:     number
}

export function Paginacao({
  paginaAtual,
  totalPaginas,
  total,
  porPagina,
}: PaginacaoProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  if (totalPaginas <= 1) return null

  function irParaPagina(p: number) {
    const novoParams = new URLSearchParams(params.toString())
    novoParams.set('pagina', String(p))
    router.push(`${pathname}?${novoParams.toString()}`)
  }

  const inicio = (paginaAtual - 1) * porPagina + 1
  const fim    = Math.min(paginaAtual * porPagina, total)

  // Gera janela de páginas visíveis (máx 5 ao redor da atual)
  const paginas: (number | '...')[] = []
  for (let i = 1; i <= totalPaginas; i++) {
    if (
      i === 1 ||
      i === totalPaginas ||
      (i >= paginaAtual - 1 && i <= paginaAtual + 1)
    ) {
      paginas.push(i)
    } else if (paginas[paginas.length - 1] !== '...') {
      paginas.push('...')
    }
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      {/* Contagem */}
      <p>
        Exibindo {inicio}–{fim} de {total} resultado{total !== 1 ? 's' : ''}
      </p>

      {/* Botões */}
      <div className="flex items-center gap-1">
        <Botao
          variante="contorno"
          tamanho="icone"
          onClick={() => irParaPagina(paginaAtual - 1)}
          disabled={paginaAtual === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Botao>

        {paginas.map((p, idx) =>
          p === '...' ? (
            <span key={`e-${idx}`} className="px-2">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => irParaPagina(p as number)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                p === paginaAtual
                  ? 'bg-brand-600 text-white'
                  : 'border border-input hover:bg-stone-100',
              )}
            >
              {p}
            </button>
          ),
        )}

        <Botao
          variante="contorno"
          tamanho="icone"
          onClick={() => irParaPagina(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
        >
          <ChevronRight className="h-4 w-4" />
        </Botao>
      </div>
    </div>
  )
}
