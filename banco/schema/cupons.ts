/**
 * Schema: Cupons de Desconto (tabelas `coupons` e `coupon_uses`)
 *
 * Permite criar cupons promocionais com diversas configurações.
 *
 * Tipos de desconto:
 *   - percentual → desconto em % sobre o valor do pedido (ex: 10%)
 *   - fixo       → desconto em valor fixo em Reais (ex: R$5,00)
 *
 * Validações aplicadas no checkout:
 *   1. Cupom ativo e dentro do período de validade
 *   2. Limite de usos totais não atingido
 *   3. Valor mínimo do pedido respeitado
 *   4. Limite de usos por cliente não atingido
 *   5. Aplica-se ao produto/categoria específico (se configurado)
 *
 * Regras importantes:
 *   - Código sempre armazenado em MAIÚSCULAS
 *   - Uso só é registrado em coupon_uses após confirmação do pagamento
 *   - Dois cupons não podem ser usados no mesmo pedido
 *   - maxDiscountAmount limita o desconto máximo em cupons percentuais
 */

import {
  mysqlTable,
  int,
  varchar,
  decimal,
  tinyint,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { clientes }  from './clientes'
import { pedidos }   from './pedidos'

// ─── Tabela: coupons (cupons) ─────────────────────────────
export const cupons = mysqlTable(
  'coupons',
  {
    /** Identificador único do cupom */
    id: int('id').autoincrement().primaryKey(),

    /**
     * Código do cupom — digitado pelo cliente no checkout.
     * Sempre armazenado em MAIÚSCULAS.
     * Exemplos: "BEMVINDO10", "NATAL2026", "PRIMEIRACOMPRA"
     */
    codigo: varchar('code', { length: 50 }).notNull().unique(),

    /** Descrição interna (visível apenas no admin) */
    descricao: varchar('description', { length: 255 }),

    /**
     * Tipo do desconto:
     *   - percentual → ex: 10 = 10% de desconto
     *   - fixo       → ex: 5.00 = R$5,00 de desconto
     */
    tipo: mysqlEnum('type', ['percentual', 'fixo']).notNull(),

    /** Valor do desconto (% ou R$ conforme o tipo) */
    valor: decimal('value', { precision: 10, scale: 2 }).notNull(),

    /**
     * Valor mínimo do pedido para usar o cupom.
     * NULL = sem valor mínimo.
     */
    valorMinimoPedido: decimal('min_order_amount', { precision: 10, scale: 2 }),

    /**
     * Desconto máximo em Reais para cupons percentuais.
     * Exemplo: tipo=percentual, valor=50, maxDesconto=20.00
     * → máximo de R$20 de desconto mesmo que 50% seja maior
     * NULL = sem limite de desconto
     */
    maxDesconto: decimal('max_discount_amount', { precision: 10, scale: 2 }),

    /**
     * Quantidade máxima de usos totais do cupom.
     * NULL = ilimitado
     */
    maxUsos: int('max_uses'),

    /** Contador de usos já realizados (atualizado a cada uso confirmado) */
    usosAtuais: int('current_uses').notNull().default(0),

    /**
     * Quantas vezes o mesmo cliente pode usar este cupom.
     * Padrão = 1 (uso único por cliente)
     */
    maxUsosPorCliente: int('max_uses_per_customer').notNull().default(1),

    /**
     * Para quem o cupom se aplica:
     *   - todos     → qualquer produto
     *   - categoria → só produtos da categoria indicada em appliesToId
     *   - produto   → só o produto indicado em appliesToId
     */
    aplicaA: mysqlEnum('applies_to', ['todos', 'categoria', 'produto'])
      .notNull()
      .default('todos'),

    /**
     * ID da categoria ou produto ao qual o cupom se aplica.
     * NULL quando aplicaA = 'todos'
     */
    aplicaAId: int('applies_to_id'),

    /** Se o cupom está ativo e pode ser usado */
    ativo: tinyint('is_active').notNull().default(1),

    /** Data de início da validade (NULL = válido desde sempre) */
    validoDesde: timestamp('valid_from'),

    /** Data de término da validade (NULL = sem vencimento) */
    validoAte: timestamp('valid_until'),

    /** Data de criação */
    criadoEm: timestamp('created_at').defaultNow().notNull(),

    /** Data da última atualização */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    codigoIdx:  uniqueIndex('coupons_code_idx').on(tabela.codigo),
    ativoIdx:   index('coupons_is_active_idx').on(tabela.ativo),
    validadeIdx: index('coupons_validity_idx').on(tabela.ativo, tabela.validoDesde, tabela.validoAte),
  }),
)

// ─── Tabela: coupon_uses (uso de cupons) ──────────────────
export const usosCupom = mysqlTable(
  'coupon_uses',
  {
    /** Identificador único do registro de uso */
    id: int('id').autoincrement().primaryKey(),

    /** Cupom utilizado */
    cupomId: int('coupon_id').notNull().references(() => cupons.id),

    /**
     * Cliente que usou o cupom.
     * NULL = guest checkout (compra sem conta)
     */
    clienteId: int('customer_id').references(() => clientes.id),

    /** Pedido no qual o cupom foi aplicado */
    pedidoId: int('order_id').notNull().references(() => pedidos.id),

    /** Valor do desconto efetivamente aplicado neste pedido */
    valorDesconto: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),

    /** Data e hora em que o cupom foi usado (após confirmação de pagamento) */
    usadoEm: timestamp('used_at').defaultNow().notNull(),
  },
  (tabela) => ({
    // Índice composto para verificar uso por cliente
    cupomClienteIdx: index('coupon_uses_coupon_customer_idx').on(tabela.cupomId, tabela.clienteId),
    cupomIdx:        index('coupon_uses_coupon_id_idx').on(tabela.cupomId),
    pedidoIdx:       index('coupon_uses_order_id_idx').on(tabela.pedidoId),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const cuponsRelations = relations(cupons, ({ many }) => ({
  /** Histórico de usos deste cupom */
  usos: many(usosCupom),
}))

export const usosCupomRelations = relations(usosCupom, ({ one }) => ({
  cupom:   one(cupons,   { fields: [usosCupom.cupomId],   references: [cupons.id] }),
  cliente: one(clientes, { fields: [usosCupom.clienteId], references: [clientes.id] }),
  pedido:  one(pedidos,  { fields: [usosCupom.pedidoId],  references: [pedidos.id] }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Cupom       = typeof cupons.$inferSelect
export type NovoCupom   = typeof cupons.$inferInsert
export type UsoCupom    = typeof usosCupom.$inferSelect
export type TipoCupom   = 'percentual' | 'fixo'
