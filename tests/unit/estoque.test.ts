/**
 * Testes Unitários — Lógica de Estoque
 *
 * Testa a lógica de cálculo das mutations de estoque sem banco real.
 */

import { describe, it, expect } from 'vitest'

// ── Replica a lógica de ajusteEstoque para testes unitários ───

function calcularNovaQuantidade(
  qtdAtual: number,
  tipo: 'entrada' | 'saida' | 'ajuste',
  quantidade: number,
): number {
  if (tipo === 'entrada') return qtdAtual + quantidade
  if (tipo === 'saida')   return Math.max(0, qtdAtual - quantidade)
  return Math.max(0, quantidade) // ajuste absoluto
}

describe('calcularNovaQuantidade', () => {
  describe('entrada', () => {
    it('soma quantidade ao estoque atual', () => {
      expect(calcularNovaQuantidade(10, 'entrada', 5)).toBe(15)
    })

    it('funciona com estoque zerado', () => {
      expect(calcularNovaQuantidade(0, 'entrada', 8)).toBe(8)
    })
  })

  describe('saida', () => {
    it('subtrai quantidade do estoque atual', () => {
      expect(calcularNovaQuantidade(10, 'saida', 3)).toBe(7)
    })

    it('não permite estoque negativo', () => {
      expect(calcularNovaQuantidade(5, 'saida', 10)).toBe(0)
    })

    it('permite zerar exatamente', () => {
      expect(calcularNovaQuantidade(5, 'saida', 5)).toBe(0)
    })
  })

  describe('ajuste (absoluto)', () => {
    it('define o valor exato', () => {
      expect(calcularNovaQuantidade(10, 'ajuste', 3)).toBe(3)
    })

    it('não permite valor negativo no ajuste', () => {
      expect(calcularNovaQuantidade(10, 'ajuste', -5)).toBe(0)
    })

    it('pode zerar o estoque via ajuste', () => {
      expect(calcularNovaQuantidade(10, 'ajuste', 0)).toBe(0)
    })
  })
})
