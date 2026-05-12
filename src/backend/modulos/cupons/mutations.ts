/**
 * Mutations de Cupons — Felipe's Bakery
 *
 * Operações de escrita para o módulo de cupons de desconto.
 * Server-only.
 */

import 'server-only'
import { eq, sql }   from 'drizzle-orm'
import { db }        from '@backend/lib/banco'
import { cupons }    from '@schema'
import {
  validarParametrosLote,
  gerarCodigosUnicos,
} from './helpers'

// ── Tipos ─────────────────────────────────────────────────────

export interface CriarCupomInput {
  codigo:               string
  descricao?:           string | null
  tipo:                 'percentual' | 'fixo'
  valor:                string
  valorMinimoPedido?:   string | null
  maxDesconto?:         string | null
  maxUsos?:             number | null
  maxUsosPorCliente?:   number
  aplicaA?:             'todos' | 'categoria' | 'produto'
  aplicaAId?:           number | null
  ativo?:               0 | 1
  validoDesde?:         Date | null
  validoAte?:           Date | null
}

export type EditarCupomInput = Partial<CriarCupomInput>

// ── Funções ───────────────────────────────────────────────────

/**
 * Cria um novo cupom de desconto.
 * O código é normalizado para maiúsculas antes de gravar.
 */
export async function criarCupom(dados: CriarCupomInput) {
  const [inserido] = await db.insert(cupons).values({
    codigo:             dados.codigo.toUpperCase().trim(),
    descricao:          dados.descricao ?? null,
    tipo:               dados.tipo,
    valor:              dados.valor,
    valorMinimoPedido:  dados.valorMinimoPedido ?? null,
    maxDesconto:        dados.maxDesconto ?? null,
    maxUsos:            dados.maxUsos ?? null,
    maxUsosPorCliente:  dados.maxUsosPorCliente ?? 1,
    aplicaA:            dados.aplicaA ?? 'todos',
    aplicaAId:          dados.aplicaAId ?? null,
    ativo:              dados.ativo ?? 1,
    validoDesde:        dados.validoDesde ?? null,
    validoAte:          dados.validoAte ?? null,
  })

  return { id: (inserido as any).insertId as number }
}

/**
 * Atualiza um cupom existente.
 * Permite alterar qualquer campo configurável.
 */
export async function atualizarCupom(id: number, dados: EditarCupomInput) {
  const atualizacoes: Record<string, unknown> = { ...dados }
  if (typeof dados.codigo === 'string') {
    atualizacoes.codigo = dados.codigo.toUpperCase().trim()
  }

  await db
    .update(cupons)
    .set(atualizacoes as any)
    .where(eq(cupons.id, id))
}

/**
 * Alterna o status ativo/inativo do cupom.
 */
export async function alternarAtivoCupom(id: number) {
  await db
    .update(cupons)
    .set({ ativo: sql`1 - ${cupons.ativo}` })
    .where(eq(cupons.id, id))
}

/**
 * Remove um cupom permanentemente.
 * Os registros em coupon_uses são preservados (histórico de uso).
 */
export async function deletarCupom(id: number) {
  await db
    .delete(cupons)
    .where(eq(cupons.id, id))
}

// ── Geração em lote ───────────────────────────────────────────

export interface GerarLoteInput {
  /** Prefixo aplicado a todos os códigos. Exemplo: "NATAL" → "NATAL-A1B2" */
  prefixo:           string
  /** Quantidade de cupons únicos a gerar (1 a 500) */
  quantidade:        number
  tipo:              'percentual' | 'fixo'
  valor:             string
  descricao?:        string | null
  valorMinimoPedido?: string | null
  maxDesconto?:      string | null
  maxUsosPorCliente?: number
  validoAte?:        Date | null
}

/**
 * Gera N cupons únicos em uma única operação (lote).
 * Útil para campanhas: "gerar 50 códigos NATAL com 15% off para distribuir".
 *
 * Cada cupom é independente, com seu próprio código único e um uso por cliente.
 * Códigos seguem o padrão: PREFIXO-XXXXXX (6 chars alfanuméricos aleatórios).
 *
 * Retorna a lista dos códigos gerados para o admin copiar/distribuir.
 */
export async function gerarCuponsLote(dados: GerarLoteInput): Promise<string[]> {
  const { prefixoNormalizado } = validarParametrosLote(dados.prefixo, dados.quantidade)
  const codigos = gerarCodigosUnicos(prefixoNormalizado, dados.quantidade)

  const linhas = codigos.map((codigo) => ({
    codigo,
    descricao:         dados.descricao ?? null,
    tipo:              dados.tipo,
    valor:             dados.valor,
    valorMinimoPedido: dados.valorMinimoPedido ?? null,
    maxDesconto:       dados.maxDesconto ?? null,
    maxUsos:           1,                 // cada código do lote vale 1 uso só
    maxUsosPorCliente: dados.maxUsosPorCliente ?? 1,
    aplicaA:           'todos' as const,
    aplicaAId:         null,
    ativo:             1 as const,
    validoDesde:       null,
    validoAte:         dados.validoAte ?? null,
  }))

  // Insere todos de uma vez (melhor que 50 INSERTs separados)
  await db.insert(cupons).values(linhas)

  return codigos
}

