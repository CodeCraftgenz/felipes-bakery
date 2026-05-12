/**
 * Testes dos helpers de Cupons — Felipe's Bakery
 *
 * Cobre as regras de negócio puras (sem banco):
 *   - normalização de prefixo
 *   - validação de parâmetros de lote
 *   - geração de códigos únicos
 */

import { describe, expect, it } from 'vitest'
import {
  LOTE_MAX,
  PREFIXO_MIN,
  PREFIXO_MAX,
  normalizarPrefixo,
  validarParametrosLote,
  gerarCodigosUnicos,
} from '@/backend/modulos/cupons/helpers'

describe('normalizarPrefixo', () => {
  it('converte para maiúsculas', () => {
    expect(normalizarPrefixo('natal')).toBe('NATAL')
  })

  it('remove espaços nas pontas', () => {
    expect(normalizarPrefixo('  PASCOA  ')).toBe('PASCOA')
  })

  it('remove caracteres não alfanuméricos', () => {
    expect(normalizarPrefixo('Natal-2026!')).toBe('NATAL2026')
  })

  it('remove acentos (filtra para A-Z)', () => {
    expect(normalizarPrefixo('Páscoa')).toBe('PSCOA')
  })

  it('retorna string vazia para input só com símbolos', () => {
    expect(normalizarPrefixo('!@#$%')).toBe('')
  })
})

describe('validarParametrosLote', () => {
  it('aceita parâmetros válidos', () => {
    expect(() => validarParametrosLote('NATAL', 50)).not.toThrow()
    expect(validarParametrosLote('NATAL', 50).prefixoNormalizado).toBe('NATAL')
  })

  it('normaliza o prefixo no retorno', () => {
    const r = validarParametrosLote('  Natal-2026  ', 10)
    expect(r.prefixoNormalizado).toBe('NATAL2026')
  })

  it('rejeita quantidade zero', () => {
    expect(() => validarParametrosLote('OK', 0)).toThrow(/Quantidade/)
  })

  it('rejeita quantidade negativa', () => {
    expect(() => validarParametrosLote('OK', -1)).toThrow(/Quantidade/)
  })

  it('rejeita quantidade acima do LOTE_MAX', () => {
    expect(() => validarParametrosLote('OK', LOTE_MAX + 1)).toThrow(/Quantidade/)
  })

  it('aceita exatamente o LOTE_MAX', () => {
    expect(() => validarParametrosLote('OK', LOTE_MAX)).not.toThrow()
  })

  it('rejeita quantidade não inteira', () => {
    expect(() => validarParametrosLote('OK', 3.5)).toThrow(/Quantidade/)
  })

  it('rejeita prefixo curto demais (após normalização)', () => {
    expect(() => validarParametrosLote('A', 10)).toThrow(/Prefixo/)
    expect(() => validarParametrosLote('!@#', 10)).toThrow(/Prefixo/)
  })

  it('rejeita prefixo longo demais', () => {
    const longo = 'A'.repeat(PREFIXO_MAX + 1)
    expect(() => validarParametrosLote(longo, 10)).toThrow(/Prefixo/)
  })

  it('aceita prefixo com tamanho mínimo (após normalização)', () => {
    expect(() => validarParametrosLote('AB', 10)).not.toThrow()
    expect(validarParametrosLote('AB', 10).prefixoNormalizado.length).toBe(PREFIXO_MIN)
  })
})

describe('gerarCodigosUnicos', () => {
  it('retorna a quantidade exata pedida', () => {
    const codigos = gerarCodigosUnicos('NATAL', 5)
    expect(codigos).toHaveLength(5)
  })

  it('gera códigos com o prefixo correto', () => {
    const codigos = gerarCodigosUnicos('PASCOA', 3)
    codigos.forEach((c) => {
      expect(c.startsWith('PASCOA-')).toBe(true)
    })
  })

  it('gera códigos com 6 chars no sufixo', () => {
    const codigos = gerarCodigosUnicos('TEST', 3)
    codigos.forEach((c) => {
      const [prefixo, sufixo] = c.split('-')
      expect(prefixo).toBe('TEST')
      expect(sufixo).toHaveLength(6)
    })
  })

  it('sufixos só usam chars alfanuméricos maiúsculos', () => {
    const codigos = gerarCodigosUnicos('X', 50)
    codigos.forEach((c) => {
      const sufixo = c.split('-')[1]
      expect(sufixo).toMatch(/^[A-Z0-9]{6}$/)
    })
  })

  it('garante unicidade em lotes grandes', () => {
    const codigos = gerarCodigosUnicos('LOTE', 200)
    const conjunto = new Set(codigos)
    expect(conjunto.size).toBe(200)
  })

  it('retorna array vazio quando quantidade é zero', () => {
    expect(gerarCodigosUnicos('TEST', 0)).toEqual([])
  })
})
