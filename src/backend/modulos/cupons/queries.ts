/**
 * Queries de Cupons — Felipe's Bakery
 *
 * Validação e consulta de cupons de desconto.
 * Server-only.
 */

import 'server-only'
import { eq, and, sql, desc, gte, lte, isNull, or, ne } from 'drizzle-orm'
import { db }                 from '@backend/lib/banco'
import { cupons, usosCupom }  from '@schema'

// ── Tipos ─────────────────────────────────────────────────────

/** Resultado da validação de um cupom */
export type ResultadoValidacaoCupom =
  | { valido: true;  cupom: CupomValidado }
  | { valido: false; motivo: string }

export type CupomValidado = {
  id:           number
  codigo:       string
  tipo:         'percentual' | 'fixo'
  /** Valor base do cupom (% ou R$) */
  valor:        string
  /** Valor calculado do desconto (em R$) para o subtotal fornecido */
  valorDesconto: number
}

// ── Funções ───────────────────────────────────────────────────

/**
 * Valida e calcula o desconto de um cupom para um subtotal específico.
 *
 * Verifica:
 *   - Cupom existe e está ativo
 *   - Está dentro do período de validade
 *   - Não ultrapassou o limite de usos
 *   - O pedido atinge o valor mínimo (se definido)
 *
 * @param codigo   - Código do cupom (case-insensitive, normalizado para uppercase)
 * @param subtotal - Valor do carrinho antes do desconto
 * @param clienteId - ID do cliente (para verificar limite por cliente)
 */
export async function validarCupom(
  codigo: string,
  subtotal: number,
  clienteId?: number,
): Promise<ResultadoValidacaoCupom> {
  const codigoNormalizado = codigo.toUpperCase().trim()

  // Busca o cupom no banco
  const [cupom] = await db
    .select()
    .from(cupons)
    .where(
      and(
        eq(cupons.codigo, codigoNormalizado),
        eq(cupons.ativo, 1),
      ),
    )
    .limit(1)

  // Cupom não encontrado
  if (!cupom) {
    return { valido: false, motivo: 'Cupom não encontrado ou inválido' }
  }

  // Verifica validade temporal
  const agora = new Date()
  if (cupom.validoAte && new Date(cupom.validoAte) < agora) {
    return { valido: false, motivo: 'Este cupom está expirado' }
  }
  if (cupom.validoDesde && new Date(cupom.validoDesde) > agora) {
    return { valido: false, motivo: 'Este cupom ainda não está disponível' }
  }

  // Verifica limite total de usos
  if (cupom.maxUsos !== null && cupom.usosAtuais >= cupom.maxUsos) {
    return { valido: false, motivo: 'Este cupom atingiu o limite de usos' }
  }

  // Verifica valor mínimo do pedido
  if (cupom.valorMinimoPedido !== null) {
    const minimo = parseFloat(cupom.valorMinimoPedido)
    if (subtotal < minimo) {
      return {
        valido: false,
        motivo: `Pedido mínimo de R$ ${minimo.toFixed(2).replace('.', ',')} para usar este cupom`,
      }
    }
  }

  // Verifica limite por cliente
  if (clienteId && cupom.maxUsosPorCliente) {
    const [usoCliente] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(usosCupom)
      .where(
        and(
          eq(usosCupom.cupomId, cupom.id),
          eq(usosCupom.clienteId, clienteId),
        ),
      )

    if (usoCliente && usoCliente.total >= cupom.maxUsosPorCliente) {
      return {
        valido: false,
        motivo: 'Você já utilizou este cupom o número máximo de vezes',
      }
    }
  }

  // ── Calcula o valor do desconto ───────────────────────────
  let valorDesconto = 0
  const valorBase = parseFloat(cupom.valor)

  if (cupom.tipo === 'percentual') {
    // Ex: 10% de desconto sobre R$ 50,00 = R$ 5,00
    valorDesconto = subtotal * (valorBase / 100)
    // Aplica limite máximo se configurado
    if (cupom.maxDesconto !== null) {
      valorDesconto = Math.min(valorDesconto, parseFloat(cupom.maxDesconto))
    }
  } else if (cupom.tipo === 'fixo') {
    // Desconto fixo: não pode exceder o subtotal
    valorDesconto = Math.min(valorBase, subtotal)
  }

  // Arredonda para 2 casas decimais
  valorDesconto = Math.round(valorDesconto * 100) / 100

  return {
    valido: true,
    cupom: {
      id:            cupom.id,
      codigo:        cupom.codigo,
      tipo:          cupom.tipo as 'percentual' | 'fixo',
      valor:         cupom.valor,
      valorDesconto,
    },
  }
}

/**
 * Lista todos os cupons cadastrados para o painel admin.
 * Ordenados por mais recentes primeiro.
 */
export async function listarCupons() {
  return db
    .select()
    .from(cupons)
    .orderBy(desc(cupons.criadoEm))
}

/**
 * Busca um cupom pelo ID.
 */
export async function buscarCupomPorId(id: number) {
  const [cupom] = await db
    .select()
    .from(cupons)
    .where(eq(cupons.id, id))
    .limit(1)
  return cupom ?? null
}

// ── Cupons públicos (vitrine) ─────────────────────────────────

export type CupomPublico = {
  codigo:        string
  descricao:     string | null
  tipo:          'percentual' | 'fixo'
  valor:         string
  valorMinimoPedido: string | null
  validoAte:     Date | null
}

/**
 * Lista cupons que devem aparecer publicamente na vitrine do site.
 *
 * Critérios:
 *   - ativo = 1
 *   - dentro da janela de validade (validoDesde/validoAte)
 *   - NÃO é cupom de uso único (excludes lote — esses são personais)
 *
 * O admin controla a visibilidade simplesmente ativando/desativando.
 */
export async function listarCuponsPublicos(): Promise<CupomPublico[]> {
  const agora = new Date()

  const linhas = await db
    .select({
      codigo:            cupons.codigo,
      descricao:         cupons.descricao,
      tipo:              cupons.tipo,
      valor:             cupons.valor,
      valorMinimoPedido: cupons.valorMinimoPedido,
      validoAte:         cupons.validoAte,
    })
    .from(cupons)
    .where(and(
      eq(cupons.ativo, 1),
      // Exclui cupons de lote (maxUsos = 1, são códigos pessoais)
      or(isNull(cupons.maxUsos), ne(cupons.maxUsos, 1)),
      // Dentro da validade
      or(isNull(cupons.validoDesde), lte(cupons.validoDesde, agora)),
      or(isNull(cupons.validoAte),   gte(cupons.validoAte,   agora)),
      // Não esgotado
      or(isNull(cupons.maxUsos), sql`${cupons.usosAtuais} < ${cupons.maxUsos}`),
    ))
    .orderBy(desc(cupons.criadoEm))
    .limit(6)

  return linhas.map((l) => ({
    codigo:            l.codigo,
    descricao:         l.descricao,
    tipo:              l.tipo as 'percentual' | 'fixo',
    valor:             l.valor,
    valorMinimoPedido: l.valorMinimoPedido,
    validoAte:         l.validoAte,
  }))
}
