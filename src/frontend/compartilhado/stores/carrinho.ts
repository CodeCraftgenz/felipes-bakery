/**
 * Store do Carrinho — Felipe's Bakery
 *
 * Estado global do carrinho de compras gerenciado pelo Zustand.
 * Persiste os itens no localStorage para que o carrinho sobreviva
 * ao recarregamento da página.
 *
 * Limites de negócio:
 *   - LIMITE_TOTAL_ITENS: máximo de unidades somadas no carrinho
 *   - LIMITE_POR_PRODUTO: máximo de unidades de um mesmo produto
 *   Esses limites refletem a capacidade de produção/entrega da padaria
 *   e evitam pedidos abusivos ou erros de digitação do cliente.
 *
 * Responsabilidades:
 *   - Adicionar / remover / atualizar quantidade de itens (com validação)
 *   - Calcular subtotal, desconto e total
 *   - Aplicar/remover cupom de desconto
 *   - Limpar o carrinho após finalização do pedido
 *
 * Uso:
 *   const { itens, adicionarItem, total } = useCarrinho()
 *   const resultado = adicionarItem(produto)
 *   if (!resultado.ok) toast.error(resultado.mensagem)
 */

import { create }          from 'zustand'
import { persist }         from 'zustand/middleware'
import { immer }           from 'zustand/middleware/immer'

// ── Limites de negócio ───────────────────────────────────────
/** Quantidade máxima total de unidades no carrinho */
export const LIMITE_TOTAL_ITENS = 50

/** Quantidade máxima por produto individual */
export const LIMITE_POR_PRODUTO = 20

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

/** Resultado de uma operação no carrinho (ok ou bloqueado pelo limite) */
export type ResultadoCarrinho =
  | { ok: true }
  | {
      ok: false
      motivo:    'max_produto' | 'max_total'
      limite:    number
      mensagem:  string
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
  adicionarItem: (
    item: Omit<ItemCarrinho, 'quantidade'>,
    quantidade?: number,
  ) => ResultadoCarrinho
  /** Remove um produto completamente do carrinho */
  removerItem:      (produtoId: number) => void
  /** Atualiza a quantidade de um produto (0 = remove) */
  atualizarQuantidade: (produtoId: number, quantidade: number) => ResultadoCarrinho
  /** Aplica cupom de desconto (vem do servidor após validação) */
  aplicarCupom:     (cupom: CupomAplicado) => void
  /** Remove o cupom aplicado */
  removerCupom:     () => void
  /** Limpa o carrinho (chamar após finalizar o pedido) */
  limparCarrinho:   () => void
}

// ── Helpers internos ─────────────────────────────────────────
function somarOutrosItens(
  itens: ItemCarrinho[],
  produtoIdExcluir: number,
): number {
  return itens
    .filter((i) => i.produtoId !== produtoIdExcluir)
    .reduce((soma, i) => soma + i.quantidade, 0)
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
        const estadoAtual = get()
        const itemExistente = estadoAtual.itens.find(
          (i) => i.produtoId === novoItem.produtoId,
        )
        const quantidadeAtualProduto = itemExistente?.quantidade ?? 0
        const quantidadeFinalProduto = quantidadeAtualProduto + quantidade

        // Validação 1: limite por produto
        if (quantidadeFinalProduto > LIMITE_POR_PRODUTO) {
          return {
            ok: false,
            motivo:   'max_produto',
            limite:   LIMITE_POR_PRODUTO,
            mensagem: `Limite de ${LIMITE_POR_PRODUTO} unidades por produto atingido.`,
          }
        }

        // Validação 2: limite total do carrinho
        const totalOutros = somarOutrosItens(estadoAtual.itens, novoItem.produtoId)
        if (totalOutros + quantidadeFinalProduto > LIMITE_TOTAL_ITENS) {
          return {
            ok: false,
            motivo:   'max_total',
            limite:   LIMITE_TOTAL_ITENS,
            mensagem: `Limite de ${LIMITE_TOTAL_ITENS} itens no carrinho atingido.`,
          }
        }

        set((estado) => {
          const indice = estado.itens.findIndex(
            (i) => i.produtoId === novoItem.produtoId,
          )

          if (indice >= 0) {
            // Produto já existe — aumenta a quantidade
            estado.itens[indice].quantidade = quantidadeFinalProduto
          } else {
            // Produto novo — adiciona com a quantidade inicial
            estado.itens.push({ ...novoItem, quantidade })
          }
        })

        return { ok: true }
      },

      removerItem: (produtoId) => {
        set((estado) => {
          estado.itens = estado.itens.filter((i) => i.produtoId !== produtoId)
        })
      },

      atualizarQuantidade: (produtoId, quantidade) => {
        if (quantidade <= 0) {
          // Quantidade zero ou negativa = remove o item (sem violar limites)
          set((estado) => {
            estado.itens = estado.itens.filter((i) => i.produtoId !== produtoId)
          })
          return { ok: true }
        }

        // Validação 1: limite por produto
        if (quantidade > LIMITE_POR_PRODUTO) {
          return {
            ok: false,
            motivo:   'max_produto',
            limite:   LIMITE_POR_PRODUTO,
            mensagem: `Limite de ${LIMITE_POR_PRODUTO} unidades por produto atingido.`,
          }
        }

        // Validação 2: limite total — soma outros itens + nova quantidade deste
        const totalOutros = somarOutrosItens(get().itens, produtoId)
        if (totalOutros + quantidade > LIMITE_TOTAL_ITENS) {
          return {
            ok: false,
            motivo:   'max_total',
            limite:   LIMITE_TOTAL_ITENS,
            mensagem: `Limite de ${LIMITE_TOTAL_ITENS} itens no carrinho atingido.`,
          }
        }

        set((estado) => {
          const item = estado.itens.find((i) => i.produtoId === produtoId)
          if (item) {
            item.quantidade = quantidade
          }
        })

        return { ok: true }
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
