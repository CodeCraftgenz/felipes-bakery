/**
 * Mutations de Estoque — Felipe's Bakery
 *
 * Operações de ajuste de estoque pelo painel admin.
 * Server-only.
 */

import 'server-only'
import { eq }  from 'drizzle-orm'
import { db }  from '@backend/lib/banco'
import { estoque, movimentacoesEstoque } from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'

// ── Funções ───────────────────────────────────────────────────

/**
 * Ajusta o estoque de um produto e registra a movimentação.
 * Usado pelo painel admin ao receber mercadoria ou corrigir divergência.
 *
 * @param produtoId  - ID do produto
 * @param tipo       - 'entrada' (adiciona), 'saida' (remove), 'ajuste' (define absoluto)
 * @param quantidade - Quantidade a movimentar (sempre positivo)
 * @param motivo     - Descrição da movimentação (ex: "Recebimento de fornecedor")
 * @param usuarioId  - ID do admin que realizou o ajuste
 */
export async function ajustarEstoque(
  produtoId:  number,
  tipo:       TipoMovimentacao,
  quantidade: number,
  motivo:     string,
  usuarioId?: number,
) {
  await db.transaction(async (tx) => {
    // Busca a quantidade atual
    const [atual] = await tx
      .select({ quantidade: estoque.quantidade })
      .from(estoque)
      .where(eq(estoque.produtoId, produtoId))
      .limit(1)

    const qtdAtual = atual?.quantidade ?? 0
    let novaQtd    = qtdAtual

    if (tipo === 'entrada') {
      novaQtd = qtdAtual + quantidade
    } else if (tipo === 'saida') {
      novaQtd = Math.max(0, qtdAtual - quantidade)
    } else {
      // Ajuste absoluto: define o valor exato
      novaQtd = Math.max(0, quantidade)
    }

    // Atualiza o estoque
    await tx
      .update(estoque)
      .set({ quantidade: novaQtd, atualizadoEm: new Date() })
      .where(eq(estoque.produtoId, produtoId))

    // Registra a movimentação para auditoria.
    // Convenção: positivo para entrada, negativo para saída/ajuste reduzindo estoque.
    const delta =
      tipo === 'entrada' ? quantidade :
      tipo === 'saida'   ? -quantidade :
      novaQtd - qtdAtual // ajuste absoluto: variação efetiva

    await tx.insert(movimentacoesEstoque).values({
      produtoId,
      tipo,
      quantidade: delta,
      motivo,
      usuarioId:  usuarioId ?? null,
    })
  })
}

/**
 * Atualiza o alerta mínimo de estoque de um produto.
 */
export async function atualizarAlertaMinimo(produtoId: number, alertaMinimo: number) {
  await db
    .update(estoque)
    .set({ alertaMinimo })
    .where(eq(estoque.produtoId, produtoId))
}
