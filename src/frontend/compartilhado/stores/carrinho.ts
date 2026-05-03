/**
 * Store do Carrinho — Felipe's Bakery
 *
 * Estado global do carrinho de compras gerenciado pelo Zustand.
 * Persiste os itens no localStorage para que o carrinho sobreviva
 * ao recarregamento da página.
 *
 * Responsabilidades:
 *   - Adicionar / remover / atualizar quantidade de itens
 *   - Calcular subtotal, desconto e total
 *   - Aplicar/remover cupom de desconto
 *   - Limpar o carrinho após finalização do pedido
 *
 * Uso:
 *   const { itens, adicionarItem, total } = useCarrinho()
 */

import { create }          from 'zustand'
import { persist }         from 'zustand/middleware'
import { immer }           from 'zustand/middleware/immer'

// ── Tipos ─────────────────────────────────────────────────────

/** Um produto adicionado ao carrinho */
export interface ItemCarrinho {
  /** ID do produto no banco */
  produtoId:   number
  /** Slug para link da página do produto */
  slug:        string
  /** Nome do produto */
  nome:        string
  /** Preço unitário no momento da adição (snapshot) */
  preco:       number
  /** Quantidade desejada */
  quantidade:  number
  /** URL da imagem de capa */
  urlImagem?:  string
  /** Peso em gramas (para exibição) */
  pesoGramas?: number | null
}

/** Cupom de desconto aplicado */
export interface CupomAplicado {
  codigo:    string
  desconto:  number    // Valor em R$ do desconto
  tipo:      'percentual' | 'fixo'
  porcentagem?: number
}

/** Estado e ações do carrinho */
interface EstadoCarrinho {
  // ── Estado ────────────────────────────────────────────────
  itens:   ItemCarrinho[]
  cupom:   CupomAplicado | null

  // ── Computed (derivados) ───────────────────────────────────
  /** Número total de itens (soma das quantidades) */
  totalItens:    () => number
  /** Subtotal sem desconto */
  subtotal:      () => number
  /** Valor do desconto aplicado */
  valorDesconto: () => number
  /** Total final com desconto */
  total:         () => number

  // ── Ações ─────────────────────────────────────────────────
  /** Adiciona um produto ou aumenta a quantidade se já existir */
  adicionarItem:    (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void
  /** Remove um produto completamente do carrinho */
  removerItem:      (produtoId: number) => void
  /** Atualiza a quantidade de um produto (0 = remove) */
  atualizarQuantidade: (produtoId: number, quantidade: number) => void
  /** Aplica cupom de desconto (vem do servidor após validação) */
  aplicarCupom:     (cupom: CupomAplicado) => void
  /** Remove o cupom aplicado */
  removerCupom:     () => void
  /** Limpa o carrinho (chamar após finalizar o pedido) */
  limparCarrinho:   () => void
}

// ── Store ─────────────────────────────────────────────────────
export const useCarrinho = create<EstadoCarrinho>()(
  // persist: salva no localStorage com a chave 'felipes-carrinho'
  persist(
    // immer: permite mutação direta do estado sem spread manual
    immer((set, get) => ({
      itens: [],
      cupom: null,

      // ── Valores Derivados ──────────────────────────────────
      totalItens: () => {
        return get().itens.reduce((soma, item) => soma + item.quantidade, 0)
      },

      subtotal: () => {
        return get().itens.reduce(
          (soma, item) => soma + item.preco * item.quantidade,
          0,
        )
      },

      valorDesconto: () => {
        const cupom     = get().cupom
        const subtotal  = get().subtotal()
        if (!cupom) return 0

        if (cupom.tipo === 'percentual' && cupom.porcentagem) {
          // Desconto percentual: subtotal × (porcentagem / 100)
          return Math.min(subtotal * (cupom.porcentagem / 100), subtotal)
        }
        // Desconto fixo: valor direto (sem ultrapassar o subtotal)
        return Math.min(cupom.desconto, subtotal)
      },

      total: () => {
        return Math.max(0, get().subtotal() - get().valorDesconto())
      },

      // ── Ações ──────────────────────────────────────────────
      adicionarItem: (novoItem, quantidade = 1) => {
        set((estado) => {
          // Procura se o produto já está no carrinho
          const indice = estado.itens.findIndex(
            (i) => i.produtoId === novoItem.produtoId,
          )

          if (indice >= 0) {
            // Produto já existe — aumenta a quantidade
            estado.itens[indice].quantidade += quantidade
          } else {
            // Produto novo — adiciona com a quantidade inicial
            estado.itens.push({ ...novoItem, quantidade })
          }
        })
      },

      removerItem: (produtoId) => {
        set((estado) => {
          estado.itens = estado.itens.filter((i) => i.produtoId !== produtoId)
        })
      },

      atualizarQuantidade: (produtoId, quantidade) => {
        set((estado) => {
          if (quantidade <= 0) {
            // Quantidade zero ou negativa = remove o item
            estado.itens = estado.itens.filter((i) => i.produtoId !== produtoId)
            return
          }
          const item = estado.itens.find((i) => i.produtoId === produtoId)
          if (item) {
            item.quantidade = quantidade
          }
        })
      },

      aplicarCupom: (cupom) => {
        set((estado) => {
          estado.cupom = cupom
        })
      },

      removerCupom: () => {
        set((estado) => {
          estado.cupom = null
        })
      },

      limparCarrinho: () => {
        set((estado) => {
          estado.itens = []
          estado.cupom = null
        })
      },
    })),
    {
      name: 'felipes-carrinho',   // Chave no localStorage
      // Só persiste os itens e o cupom, não as funções
      partialize: (estado) => ({
        itens: estado.itens,
        cupom: estado.cupom,
      }),
    },
  ),
)
