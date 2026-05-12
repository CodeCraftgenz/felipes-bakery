/**
 * Helpers puros do módulo de Cupons.
 *
 * Funções sem dependência de banco/IO — seguros para testar isoladamente
 * e para serem usados tanto no servidor quanto no cliente se necessário.
 */

/** Limite total de cupons gerados por chamada da API de lote. */
export const LOTE_MAX = 500
/** Comprimento mínimo do prefixo. */
export const PREFIXO_MIN = 2
/** Comprimento máximo do prefixo (chars alfanuméricos em MAIÚSCULAS). */
export const PREFIXO_MAX = 20

/**
 * Normaliza um prefixo de cupom:
 *   - Converte para maiúsculas
 *   - Remove espaços nas pontas
 *   - Filtra apenas A-Z e 0-9 (descarta acentos, espaços e símbolos)
 *
 * @example
 *   normalizarPrefixo('  Natal-2026!  ') === 'NATAL2026'
 */
export function normalizarPrefixo(prefixo: string): string {
  return prefixo.toUpperCase().trim().replace(/[^A-Z0-9]/g, '')
}

/**
 * Valida os parâmetros de entrada para gerar um lote de cupons.
 * Lança Error com mensagem amigável quando inválido — caso contrário
 * retorna o prefixo já normalizado.
 */
export function validarParametrosLote(
  prefixo:    string,
  quantidade: number,
): { prefixoNormalizado: string } {
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > LOTE_MAX) {
    throw new Error(`Quantidade deve estar entre 1 e ${LOTE_MAX}.`)
  }

  const prefixoNormalizado = normalizarPrefixo(prefixo)
  if (prefixoNormalizado.length < PREFIXO_MIN || prefixoNormalizado.length > PREFIXO_MAX) {
    throw new Error(`Prefixo deve ter de ${PREFIXO_MIN} a ${PREFIXO_MAX} caracteres alfanuméricos.`)
  }

  return { prefixoNormalizado }
}

/**
 * Gera N códigos únicos de cupom no formato PREFIXO-XXXXXX.
 * O sufixo é derivado de UUID v4 (6 chars alfanuméricos em maiúsculas).
 *
 * Garante que os códigos retornados são todos distintos.
 *
 * @param prefixo Prefixo já normalizado (chame validarParametrosLote antes)
 * @param quantidade Quantidade a gerar (validar antes)
 */
export function gerarCodigosUnicos(prefixo: string, quantidade: number): string[] {
  const conjunto = new Set<string>()
  while (conjunto.size < quantidade) {
    const sufixo = globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    conjunto.add(`${prefixo}-${sufixo}`)
  }
  return Array.from(conjunto)
}
