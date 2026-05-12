/**
 * Testes do Carrinho — Felipe's Bakery
 *
 * Verifica as regras de negócio críticas:
 *   - Limite total de 50 unidades
 *   - Limite de 20 unidades por produto
 *   - Soma de quantidades quando adiciona o mesmo produto
 *   - Cálculo de subtotal, desconto e total
 *   - Aplicação de cupom percentual e fixo
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  useCarrinho,
  LIMITE_TOTAL_ITENS,
  LIMITE_POR_PRODUTO,
} from '@/frontend/compartilhado/stores/carrinho'

// Mock de produtos usados nos testes
const pao1 = {
  produtoId: 1,
  slug:      'pao-italiano',
  nome:      'Pão Italiano',
  preco:     20,
  urlImagem: undefined,
}

const pao2 = {
  produtoId: 2,
  slug:      'ciabatta',
  nome:      'Ciabatta',
  preco:     15,
  urlImagem: undefined,
}

const pao3 = {
  produtoId: 3,
  slug:      'focaccia',
  nome:      'Focaccia',
  preco:     30,
  urlImagem: undefined,
}

beforeEach(() => {
  // Reseta o store antes de cada teste
  useCarrinho.setState({ itens: [], cupom: null })
})

describe('Carrinho — operações básicas', () => {
  it('adiciona um item ao carrinho', () => {
    const { adicionarItem } = useCarrinho.getState()
    const r = adicionarItem(pao1, 2)

    expect(r.ok).toBe(true)
    expect(useCarrinho.getState().itens).toHaveLength(1)
    expect(useCarrinho.getState().itens[0].quantidade).toBe(2)
  })

  it('soma a quantidade ao adicionar o mesmo produto duas vezes', () => {
    const { adicionarItem } = useCarrinho.getState()
    adicionarItem(pao1, 3)
    adicionarItem(pao1, 2)

    expect(useCarrinho.getState().itens).toHaveLength(1)
    expect(useCarrinho.getState().itens[0].quantidade).toBe(5)
  })

  it('remove um item do carrinho', () => {
    const { adicionarItem, removerItem } = useCarrinho.getState()
    adicionarItem(pao1, 2)
    removerItem(pao1.produtoId)

    expect(useCarrinho.getState().itens).toHaveLength(0)
  })

  it('atualiza para 0 remove o item', () => {
    const { adicionarItem, atualizarQuantidade } = useCarrinho.getState()
    adicionarItem(pao1, 5)
    const r = atualizarQuantidade(pao1.produtoId, 0)

    expect(r.ok).toBe(true)
    expect(useCarrinho.getState().itens).toHaveLength(0)
  })

  it('limpa o carrinho inteiro', () => {
    const { adicionarItem, limparCarrinho } = useCarrinho.getState()
    adicionarItem(pao1, 3)
    adicionarItem(pao2, 4)
    limparCarrinho()

    expect(useCarrinho.getState().itens).toHaveLength(0)
    expect(useCarrinho.getState().cupom).toBeNull()
  })
})

describe('Carrinho — limites de quantidade', () => {
  it('bloqueia ao tentar adicionar mais que LIMITE_POR_PRODUTO de um item', () => {
    const { adicionarItem } = useCarrinho.getState()
    const r = adicionarItem(pao1, LIMITE_POR_PRODUTO + 1)

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.motivo).toBe('max_produto')
      expect(r.limite).toBe(LIMITE_POR_PRODUTO)
    }
    expect(useCarrinho.getState().itens).toHaveLength(0)
  })

  it('permite adicionar exatamente LIMITE_POR_PRODUTO de um item', () => {
    const { adicionarItem } = useCarrinho.getState()
    const r = adicionarItem(pao1, LIMITE_POR_PRODUTO)

    expect(r.ok).toBe(true)
    expect(useCarrinho.getState().itens[0].quantidade).toBe(LIMITE_POR_PRODUTO)
  })

  it('bloqueia adições somadas que ultrapassem LIMITE_POR_PRODUTO', () => {
    const { adicionarItem } = useCarrinho.getState()
    adicionarItem(pao1, LIMITE_POR_PRODUTO - 1)
    const r = adicionarItem(pao1, 5)

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('max_produto')
    // Quantidade não muda após falha
    expect(useCarrinho.getState().itens[0].quantidade).toBe(LIMITE_POR_PRODUTO - 1)
  })

  it('bloqueia ao ultrapassar LIMITE_TOTAL_ITENS com produtos diferentes', () => {
    const { adicionarItem } = useCarrinho.getState()
    // Acumula até o limite total usando produtos com quantidade abaixo do limite por produto
    adicionarItem(pao1, 20)
    adicionarItem(pao2, 20)
    adicionarItem(pao3, 10) // soma 50 — exatamente no limite
    const r = adicionarItem({ ...pao1, produtoId: 4, slug: 'pao4', nome: 'P4' }, 1)

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.motivo).toBe('max_total')
      expect(r.limite).toBe(LIMITE_TOTAL_ITENS)
    }
  })

  it('permite atingir LIMITE_TOTAL_ITENS exatamente', () => {
    const { adicionarItem } = useCarrinho.getState()
    adicionarItem(pao1, 20)
    adicionarItem(pao2, 20)
    const r = adicionarItem(pao3, 10)

    expect(r.ok).toBe(true)
    expect(useCarrinho.getState().totalItens()).toBe(LIMITE_TOTAL_ITENS)
  })

  it('atualizarQuantidade bloqueia se exceder limite por produto', () => {
    const { adicionarItem, atualizarQuantidade } = useCarrinho.getState()
    adicionarItem(pao1, 5)
    const r = atualizarQuantidade(pao1.produtoId, LIMITE_POR_PRODUTO + 1)

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('max_produto')
    // Quantidade não muda após falha
    expect(useCarrinho.getState().itens[0].quantidade).toBe(5)
  })

  it('atualizarQuantidade bloqueia se exceder limite total', () => {
    const { adicionarItem, atualizarQuantidade } = useCarrinho.getState()
    adicionarItem(pao1, 20)
    adicionarItem(pao2, 20)
    adicionarItem(pao3, 5) // total 45

    const r = atualizarQuantidade(pao3.produtoId, 11) // tentaria total 51
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('max_total')
    // Quantidade de pao3 não muda
    expect(
      useCarrinho.getState().itens.find((i) => i.produtoId === pao3.produtoId)!.quantidade,
    ).toBe(5)
  })
})

describe('Carrinho — cálculos de preço', () => {
  it('calcula subtotal corretamente', () => {
    const { adicionarItem } = useCarrinho.getState()
    adicionarItem(pao1, 2) // 2 × 20 = 40
    adicionarItem(pao2, 3) // 3 × 15 = 45

    expect(useCarrinho.getState().subtotal()).toBe(85)
  })

  it('aplica cupom percentual corretamente', () => {
    const { adicionarItem, aplicarCupom } = useCarrinho.getState()
    adicionarItem(pao1, 5) // 100
    aplicarCupom({ codigo: 'OFF10', desconto: 0, tipo: 'percentual', porcentagem: 10 })

    expect(useCarrinho.getState().valorDesconto()).toBe(10)
    expect(useCarrinho.getState().total()).toBe(90)
  })

  it('aplica cupom fixo corretamente', () => {
    const { adicionarItem, aplicarCupom } = useCarrinho.getState()
    adicionarItem(pao1, 5) // 100
    aplicarCupom({ codigo: 'FIX20', desconto: 20, tipo: 'fixo' })

    expect(useCarrinho.getState().valorDesconto()).toBe(20)
    expect(useCarrinho.getState().total()).toBe(80)
  })

  it('cupom não pode deixar o total negativo', () => {
    const { adicionarItem, aplicarCupom } = useCarrinho.getState()
    adicionarItem(pao1, 1) // 20
    aplicarCupom({ codigo: 'BIG', desconto: 999, tipo: 'fixo' })

    expect(useCarrinho.getState().total()).toBe(0)
  })

  it('totalItens soma quantidades de todos os produtos', () => {
    const { adicionarItem } = useCarrinho.getState()
    adicionarItem(pao1, 3)
    adicionarItem(pao2, 4)
    adicionarItem(pao3, 5)

    expect(useCarrinho.getState().totalItens()).toBe(12)
  })
})
