/**
 * Filtros do Catálogo — Felipe's Bakery
 *
 * Barra de filtros e busca do catálogo de produtos.
 * Usa search params da URL para filtros (compatível com SSR e compartilhamento de links).
 *
 * Filtros disponíveis:
 *   - Busca por nome (texto livre)
 *   - Categoria (botões de filtro)
 *
 * Client Component — atualiza a URL via router.push ao filtrar.
 */

'use client'

import React                from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X }        from 'lucide-react'
import { Entrada }          from '@frontend/compartilhado/ui/entrada'
import { Botao }            from '@frontend/compartilhado/ui/botao'
import { useDebounce }      from '@frontend/compartilhado/hooks'
import { cn }               from '@compartilhado/utils'
import type { CategoriaResumo } from '@backend/modulos/categorias/queries'

// ── Props ─────────────────────────────────────────────────────
interface PropsFiltrosCatalogo {
  categorias: CategoriaResumo[]
}

// ── Componente ────────────────────────────────────────────────
export function FiltrosCatalogo({ categorias }: PropsFiltrosCatalogo) {
  const router        = useRouter()
  const pathname      = usePathname()
  const searchParams  = useSearchParams()

  // Lê os filtros atuais da URL
  const categoriaAtual = searchParams.get('categoria') ?? ''
  const buscaAtual     = searchParams.get('busca') ?? ''

  // Estado local da busca (com debounce para não atualizar a cada tecla)
  const [buscaLocal, setBuscaLocal] = React.useState(buscaAtual)
  const buscaDebounced = useDebounce(buscaLocal, 400)

  // Atualiza a URL quando o debounce disparar
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (buscaDebounced) {
      params.set('busca', buscaDebounced)
    } else {
      params.delete('busca')
    }
    router.push(`${pathname}?${params.toString()}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced])

  // Atualiza o filtro de categoria na URL
  const aoFiltrarCategoria = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === categoriaAtual) {
      // Clicou na mesma categoria — remove o filtro
      params.delete('categoria')
    } else {
      params.set('categoria', slug)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Limpa todos os filtros
  const aoLimparFiltros = () => {
    setBuscaLocal('')
    router.push(pathname)
  }

  const temFiltrosAtivos = !!(categoriaAtual || buscaLocal)

  return (
    <div className="space-y-4">

      {/* Campo de busca */}
      <Entrada
        type="search"
        placeholder="Buscar produto..."
        value={buscaLocal}
        onChange={(e) => setBuscaLocal(e.target.value)}
        iconeEsquerda={<Search className="h-4 w-4" />}
        iconeDireita={
          buscaLocal ? (
            <button
              onClick={() => setBuscaLocal('')}
              className="hover:text-stone-600 transition-colors"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        className="w-full sm:w-72"
        aria-label="Buscar produtos no catálogo"
      />

      {/* Filtros de categoria */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Botão "Todos" */}
        <Botao
          variante={!categoriaAtual ? 'padrao' : 'contorno'}
          tamanho="p"
          onClick={() => aoFiltrarCategoria('')}
        >
          Todos
        </Botao>

        {/* Botões por categoria */}
        {categorias.map((cat) => (
          <Botao
            key={cat.id}
            variante={categoriaAtual === cat.slug ? 'padrao' : 'contorno'}
            tamanho="p"
            onClick={() => aoFiltrarCategoria(cat.slug)}
          >
            {cat.nome}
          </Botao>
        ))}

        {/* Limpar filtros */}
        {temFiltrosAtivos && (
          <Botao
            variante="fantasma"
            tamanho="p"
            onClick={aoLimparFiltros}
            className="text-stone-400 hover:text-stone-700"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar filtros
          </Botao>
        )}
      </div>

    </div>
  )
}
