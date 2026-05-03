/**
 * Schema: Estoque e Movimentações (tabelas `stock` e `stock_movements`)
 *
 * Controla a quantidade disponível de cada produto e rastreia
 * todas as entradas e saídas com rastreabilidade completa.
 *
 * Regras de negócio:
 *   - Cada produto tem EXATAMENTE UM registro de estoque (relação 1:1)
 *   - A baixa de estoque ocorre SOMENTE após confirmação de pagamento
 *   - Cancelamento de pedido RESTAURA o estoque automaticamente
 *   - Alerta é gerado quando quantidade <= alertaMinimo
 *   - Toda movimentação é registrada em stock_movements (audit trail)
 *
 * Tipos de movimentação:
 *   - entrada    → produto recebido (produção, reposição)
 *   - saida      → produto vendido (pedido pago)
 *   - ajuste     → correção manual de inventário
 */

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { produtos }   from './produtos'
import { usuarios }   from './usuarios'

// ─── Tabela: stock (estoque) ──────────────────────────────
export const estoque = mysqlTable(
  'stock',
  {
    /** Identificador único do registro de estoque */
    id: int('id').autoincrement().primaryKey(),

    /** Produto ao qual este estoque pertence (1:1 com produtos) */
    produtoId: int('product_id')
      .notNull()
      .unique()
      .references(() => produtos.id, { onDelete: 'cascade' }),

    /** Quantidade atual disponível para venda */
    quantidade: int('quantity').notNull().default(0),

    /**
     * Quantidade mínima antes de emitir alerta no admin.
     * Quando quantidade <= alertaMinimo, o dashboard exibe aviso.
     */
    alertaMinimo: int('min_quantity_alert').notNull().default(3),

    /** Data da última atualização do estoque */
    atualizadoEm: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (tabela) => ({
    produtoIdx:    uniqueIndex('stock_product_id_idx').on(tabela.produtoId),
    quantidadeIdx: index('stock_quantity_idx').on(tabela.quantidade),
  }),
)

// ─── Tabela: stock_movements (movimentações de estoque) ───
export const movimentacoesEstoque = mysqlTable(
  'stock_movements',
  {
    /** Identificador único da movimentação */
    id: int('id').autoincrement().primaryKey(),

    /** Produto cujo estoque foi movimentado */
    produtoId: int('product_id')
      .notNull()
      .references(() => produtos.id),

    /**
     * Tipo da movimentação:
     *   - entrada  → produto chegou (produção, reposição manual)
     *   - saida    → produto saiu (pedido confirmado)
     *   - ajuste   → correção manual de inventário
     */
    tipo: mysqlEnum('type', ['entrada', 'saida', 'ajuste']).notNull(),

    /**
     * Quantidade movimentada.
     * Positivo para entrada, negativo para saída/ajuste.
     */
    quantidade: int('quantity').notNull(),

    /**
     * Motivo da movimentação — obrigatório para rastreabilidade.
     * Exemplos: "pedido FBK-20260412-0001", "ajuste de inventário", "produção"
     */
    motivo: varchar('reason', { length: 255 }).notNull(),

    /**
     * Usuário admin que realizou esta movimentação.
     * NULL = sistema (movimentação automática por pedido/cancelamento)
     */
    usuarioId: int('user_id').references(() => usuarios.id),

    /**
     * ID do pedido relacionado a esta movimentação.
     * NULL para movimentações manuais.
     * FK real gerenciada via migration (evita import circular).
     */
    pedidoId: int('order_id'),

    /** Data e hora da movimentação */
    criadoEm: timestamp('created_at').defaultNow().notNull(),
  },
  (tabela) => ({
    produtoIdx:  index('stock_movements_product_id_idx').on(tabela.produtoId),
    tipoIdx:     index('stock_movements_type_idx').on(tabela.tipo),
    dataIdx:     index('stock_movements_created_at_idx').on(tabela.criadoEm),
    usuarioIdx:  index('stock_movements_user_id_idx').on(tabela.usuarioId),
    pedidoIdx:   index('stock_movements_order_id_idx').on(tabela.pedidoId),
  }),
)

// ─── Relacionamentos ──────────────────────────────────────
export const estoqueRelations = relations(estoque, ({ one }) => ({
  /** Produto ao qual este estoque pertence */
  produto: one(produtos, {
    fields:     [estoque.produtoId],
    references: [produtos.id],
  }),
}))

export const movimentacoesEstoqueRelations = relations(movimentacoesEstoque, ({ one }) => ({
  /** Produto movimentado */
  produto: one(produtos, {
    fields:     [movimentacoesEstoque.produtoId],
    references: [produtos.id],
  }),
  /** Usuário que realizou a movimentação (null = sistema) */
  usuario: one(usuarios, {
    fields:     [movimentacoesEstoque.usuarioId],
    references: [usuarios.id],
  }),
}))

// ─── Tipos TypeScript ─────────────────────────────────────
export type Estoque              = typeof estoque.$inferSelect
export type NovoEstoque          = typeof estoque.$inferInsert
export type MovimentacaoEstoque  = typeof movimentacoesEstoque.$inferSelect
export type NovaMovimentacaoEstoque = typeof movimentacoesEstoque.$inferInsert
export type TipoMovimentacao     = 'entrada' | 'saida' | 'ajuste'
