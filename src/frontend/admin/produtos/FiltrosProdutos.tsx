/**
 * FiltrosProdutos — Felipe's Bakery Admin
 *
 * Barra de filtros da listagem de produtos: busca + status + categoria.
 * Client Component — atualiza a URL com os parâmetros de filtro.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState }                    from 'react'
import { Search, Plus }                             from 'lucide-react'
import Link                                         from 'next/link'
import { Botao, Entrada }                           from '@frontend/compartilhado/ui'
import { useDebounce }                              from '@frontend/compartilhado/hooks/useDebounce'

interface Categoria {
  id:   number
  nome: string
}

interface FiltrosProdutosProps {
  categorias: Categoria[]
}

export function FiltrosProdutos({ categorias }: FiltrosProdutosProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()
  const [busca, setBusca] = useState(params.get('busca') ?? '')

  // Aplica busca com debounce de 400ms
  const buscaDebounced = useDebounce(busca, 400)

  const atualizarUrl = useCallback(
    (chave: string, valor: string) => {
      const p = new URLSearchParams(params.toString())
      if (valor) p.set(chave, valor)
      else       p.delete(chave)
      p.delete('pagina') // Reinicia paginação ao filtrar
      router.push(`${pathname}?${p.toString()}`)
    },
    [params, pathname, router],
  )

  // Dispara atualização quando busca muda (debounced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useCallback(() => { atualizarUrl('busca', buscaDebounced) }, [buscaDebounced])()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Campo de busca */}
      <Entrada
        iconeEsquerda={<Search className="h-4 w-4" />}
        placeholder="Buscar produtos..."
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          atualizarUrl('busca', e.target.value)
        }}
        className="w-full sm:w-64"
      />

      {/* Filtro de status */}
      <select
        defaultValue={params.get('status') ?? ''}
        onChange={(e) => atualizarUrl('status', e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos os status</option>
        <option value="published">Publicado</option>
        <option value="draft">Rascunho</option>
        <option value="archived">Arquivado</option>
      </select>

      {/* Filtro de categoria */}
      <select
        defaultValue={params.get('categoriaId') ?? ''}
        onChange={(e) => atualizarUrl('categoriaId', e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todas as categorias</option>
        {categorias.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.nome}</option>
        ))}
      </select>

      {/* Espaçador */}
      <div className="flex-1" />

      {/* Botão novo produto */}
      <Botao asChild tamanho="p">
        <Link href="/admin/produtos/novo">
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Produto
        </Link>
      </Botao>
    </div>
  )
}
