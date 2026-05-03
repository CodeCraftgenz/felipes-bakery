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
