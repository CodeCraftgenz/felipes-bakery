/**
 * Testes Unitários — Validações Zod de Pedido
 *
 * Cobre: schemaCriarPedido, validarCPF
 */

import { describe, it, expect } from 'vitest'
import { schemaCriarPedido } from '../../src/compartilhado/validacoes/pedido'

// ── Helpers ───────────────────────────────────────────────────

function pedidoValido() {
  return {
    // Schema exige `preco` numérico (não `precoUnitario` string)
    itens: [{ produtoId: 1, quantidade: 2, preco: 15.5 }],
    endereco: {
      // Schema exige CEP com 8 dígitos (somente números, sem traço)
      cep:          '01310100',
      logradouro:   'Av. Paulista',
      numero:       '1000',
      complemento:  'Apto 1',
      bairro:       'Bela Vista',
      cidade:       'São Paulo',
      estado:       'SP',
    },
    pagador: {
      nome:  'Felipe Oliveira',
      email: 'felipe@exemplo.com.br',
      // Schema exige CPF somente dígitos (11). Mantém CPF válido (529.982.247-25).
      cpf:   '52998224725',
    },
  }
}

// ── schemaCriarPedido ─────────────────────────────────────────

describe('schemaCriarPedido', () => {
  it('valida um pedido completo e correto', () => {
    const resultado = schemaCriarPedido.safeParse(pedidoValido())
    expect(resultado.success).toBe(true)
  })

  it('rejeita pedido sem itens', () => {
    const dados = { ...pedidoValido(), itens: [] }
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(false)
    expect(JSON.stringify(resultado)).toContain('itens')
  })

  it('rejeita quando quantidade de item é zero', () => {
    const dados = pedidoValido()
    dados.itens[0].quantidade = 0
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(false)
  })

  it('rejeita email inválido no pagador', () => {
    const dados = pedidoValido()
    dados.pagador.email = 'nao-e-email'
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(false)
  })

  it('rejeita CPF com dígitos inválidos', () => {
    const dados = pedidoValido()
    dados.pagador.cpf = '11111111111' // CPF inválido (todos iguais)
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(false)
  })

  it('rejeita endereço sem logradouro', () => {
    const dados = pedidoValido()
    dados.endereco.logradouro = ''
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(false)
  })

  it('aceita pedido com cupom opcional', () => {
    const dados = { ...pedidoValido(), codigoCupom: 'BEMVINDO10' }
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(true)
  })

  it('aceita pedido com observações opcionais', () => {
    const dados = { ...pedidoValido(), observacoes: 'Entregar no portão' }
    const resultado = schemaCriarPedido.safeParse(dados)
    expect(resultado.success).toBe(true)
  })
})
