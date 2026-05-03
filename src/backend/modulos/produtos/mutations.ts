/**
 * Mutations de Produtos — Felipe's Bakery
 *
 * Operações de escrita no banco para o módulo de produtos.
 * Usadas pelas Server Actions e Route Handlers do painel admin.
 * Server-only.
 */

import 'server-only'
import { eq }       from 'drizzle-orm'
import { db }       from '@backend/lib/banco'
import { produtos, estoque, imagensProduto } from '@schema'
import { slugificar } from '@compartilhado/utils'

// ── Tipos ─────────────────────────────────────────────────────

export interface CriarProdutoInput {
  categoriaId:  number
  nome:         string
  descricao?:   string | null
  ingredientes?: string | null
  pesoGramas?:  number | null
  preco:        string
  precoCompare?: string | null
  emDestaque:   0 | 1
  status:       'published' | 'draft' | 'archived'
}

export type EditarProdutoInput = Partial<CriarProdutoInput>

// ── Funções de Mutation ───────────────────────────────────────

/**
 * Cria um novo produto e inicializa o registro de estoque (0 unidades).
 * O slug é gerado automaticamente a partir do nome.
 */
export async function criarProduto(dados: CriarProdutoInput) {
  const slug = slugificar(dados.nome)

  // Mapeia precoCompare → precoComparacao conforme o schema Drizzle
  const { precoCompare, ...resto } = dados

  const [inserido] = await db.insert(produtos).values({
    ...resto,
    slug,
    ativo:            1,
    precoComparacao:  precoCompare ?? null,
  })

  const produtoId = (inserido as any).insertId as number

  // Inicializa estoque zerado
  await db.insert(estoque).values({
    produtoId,
    quantidade:   0,
    alertaMinimo: 3,
  })

  return { id: produtoId, slug }
}

/**
 * Atualiza os dados de um produto existente.
 * Se o nome mudou, regenera o slug.
 */
export async function editarProduto(id: number, dados: EditarProdutoInput) {
  const { precoCompare, ...resto } = dados
  const atualizacoes: Record<string, unknown> = { ...resto }

  // Regenera o slug se o nome foi alterado
  if (dados.nome) {
    atualizacoes.slug = slugificar(dados.nome)
  }

  // Mapeia precoCompare → precoComparacao conforme o schema Drizzle
  if (precoCompare !== undefined) {
    atualizacoes.precoComparacao = precoCompare ?? null
  }

  await db
    .update(produtos)
    .set(atualizacoes)
    .where(eq(produtos.id, id))
}

/**
 * Alterna o status de publicação de um produto (draft ↔ published).
 */
export async function alternarStatusProduto(id: number, novoStatus: 'published' | 'draft' | 'archived') {
  await db
    .update(produtos)
    .set({ status: novoStatus })
    .where(eq(produtos.id, id))
}

/**
 * Realiza soft delete do produto (ativo = 0, status = archived).
 * Não remove do banco para preservar histórico de pedidos.
 */
export async function excluirProduto(id: number) {
  await db
    .update(produtos)
    .set({ ativo: 0, status: 'archived' })
    .where(eq(produtos.id, id))
}

/**
 * Adiciona uma imagem ao produto.
 *
 * @param produtoId    - ID do produto dono da imagem
 * @param url          - URL completa da imagem (Cloudflare R2)
 * @param ordemExibicao - Ordem na galeria (menor = primeiro)
 */
export async function adicionarImagemProduto(
  produtoId: number,
  url: string,
  ordemExibicao = 0,
) {
  await db.insert(imagensProduto).values({
    produtoId,
    url,
    ordemExibicao,
  })
}

/**
 * Remove uma imagem do produto pelo ID.
 */
export async function removerImagemProduto(imagemId: number) {
  await db.delete(imagensProduto).where(eq(imagensProduto.id, imagemId))
}
