/**
 * Testes Unitários — Utilitários Compartilhados
 * Cobre: formatarMoeda, slugificar, calcularProximaEntrega, dentroDoPrazo,
 *        gerarNumeroPedido, truncar, formatarData
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatarMoeda,
  slugificar,
  calcularProximaEntrega,
  dentroDoPrazo,
  gerarNumeroPedido,
  truncar,
  formatarData,
} from '../../src/compartilhado/utils'

// ── formatarMoeda ─────────────────────────────────────────────

describe('formatarMoeda', () => {
  it('formata número inteiro como moeda BRL', () => {
    expect(formatarMoeda(15)).toMatch(/R\$\s*15,00/)
  })

  it('formata número decimal como moeda BRL', () => {
    expect(formatarMoeda(15.5)).toMatch(/R\$\s*15,50/)
  })

  it('formata string numérica', () => {
    expect(formatarMoeda('30.00')).toMatch(/R\$\s*30,00/)
  })

  it('formata zero corretamente', () => {
    expect(formatarMoeda(0)).toMatch(/R\$\s*0,00/)
  })
})

// ── slugificar ────────────────────────────────────────────────

describe('slugificar', () => {
  it('converte espaços para hífens', () => {
    expect(slugificar('Pão Italiano')).toBe('pao-italiano')
  })

  it('remove acentos', () => {
    expect(slugificar('Fermentação Natural')).toBe('fermentacao-natural')
  })

  it('converte para minúsculas', () => {
    expect(slugificar('CROISSANT')).toBe('croissant')
  })

  it('remove caracteres especiais', () => {
    expect(slugificar('Focaccia & Tomate!')).toBe('focaccia-tomate')
  })

  it('colapsa múltiplos hífens', () => {
    expect(slugificar('pão  artesanal')).toBe('pao-artesanal')
  })

  it('remove espaços nas bordas', () => {
    expect(slugificar('  ciabatta  ')).toBe('ciabatta')
  })
})

// ── truncar ───────────────────────────────────────────────────

describe('truncar', () => {
  it('não trunca texto abaixo do limite', () => {
    expect(truncar('curto', 10)).toBe('curto')
  })

  it('trunca e adiciona reticências', () => {
    const resultado = truncar('texto muito longo aqui', 10)
    expect(resultado).toHaveLength(11) // 10 + '…'
    expect(resultado.endsWith('…')).toBe(true)
  })

  it('não trunca texto com exatamente o limite', () => {
    expect(truncar('12345', 5)).toBe('12345')
  })
})

// ── gerarNumeroPedido ─────────────────────────────────────────

describe('gerarNumeroPedido', () => {
  it('retorna string no formato FBK-AAAAMMDD-XXXX', () => {
    const numero = gerarNumeroPedido()
    expect(numero).toMatch(/^FBK-\d{8}-\d{4}$/)
  })

  it('gera números diferentes em chamadas consecutivas', () => {
    const numeros = new Set(Array.from({ length: 20 }, () => gerarNumeroPedido()))
    // Com 20 chamadas e sequência aleatória 0001-9999, colisão é improvável
    expect(numeros.size).toBeGreaterThan(1)
  })
})

// ── calcularProximaEntrega ────────────────────────────────────

describe('calcularProximaEntrega', () => {
  it('retorna uma Data no futuro', () => {
    const entrega = calcularProximaEntrega(3, 5, 23) // Qua 23h → Sexta
    expect(entrega.getTime()).toBeGreaterThan(Date.now())
  })

  it('retorna hora zerada (meia-noite)', () => {
    const entrega = calcularProximaEntrega(3, 5, 23)
    expect(entrega.getHours()).toBe(0)
    expect(entrega.getMinutes()).toBe(0)
  })

  it('retorna o dia da semana de entrega correto', () => {
    // Fixa data para uma segunda-feira (dia 1) — antes do corte
    vi.setSystemTime(new Date('2026-04-13T10:00:00Z')) // segunda
    const entrega = calcularProximaEntrega(3, 5, 23)
    expect(entrega.getDay()).toBe(5) // sexta
    vi.useRealTimers()
  })
})

// ── dentroDoPrazo ─────────────────────────────────────────────

describe('dentroDoPrazo', () => {
  it('retorna true antes do dia de corte', () => {
    // Segunda-feira 10h — antes da quarta 23h
    vi.setSystemTime(new Date('2026-04-13T10:00:00Z'))
    expect(dentroDoPrazo(3, 23)).toBe(true)
    vi.useRealTimers()
  })

  it('retorna false depois do horário de corte no dia de corte', () => {
    // Quarta-feira 23h30 — usa construtor local (mês 3 = abril em JS)
    // para evitar deslocamento por timezone ao validar a hora.
    vi.setSystemTime(new Date(2026, 3, 15, 23, 30))
    expect(dentroDoPrazo(3, 23)).toBe(false)
    vi.useRealTimers()
  })

  it('retorna true no dia de corte antes do horário', () => {
    // Quarta-feira 12h
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    expect(dentroDoPrazo(3, 23)).toBe(true)
    vi.useRealTimers()
  })
})

// ── formatarData ──────────────────────────────────────────────

describe('formatarData', () => {
  it('formata Date object no padrão brasileiro', () => {
    // Usa construtor com componentes para criar a data no timezone local
    // (mês 3 = abril em JS), evitando deslocamento por UTC.
    const data = new Date(2026, 3, 12)
    expect(formatarData(data)).toMatch(/12\/04\/2026/)
  })

  it('aceita string de data', () => {
    // ISO com hora 12:00Z evita deslocamento de dia em qualquer timezone
    // entre UTC-12 e UTC+12 ao formatar para o calendário local.
    expect(formatarData('2026-01-01T12:00:00Z')).toMatch(/01\/01\/2026/)
  })
})
