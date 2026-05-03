/**
 * Home Page — Felipe's Bakery
 *
 * Página inicial do site público.
 * Todas as seções são Server Components que buscam dados diretamente do banco.
 *
 * Seções:
 *   1. SecaoHero           → Banner principal com CTA
 *   2. SecaoCategorias     → Cards das categorias do cardápio
 *   3. SecaoProdutosDestaque → Grade com os produtos mais pedidos
 *   4. SecaoCicloEntrega   → Explicação visual do ciclo de pedidos
 *
 * Estratégia de cache: ISR com revalidação a cada hora (3600s).
 * Os dados do cardápio mudam raramente, então cache agressivo é adequado.
 */

import type { Metadata }             from 'next'
import { buscarBanners }             from '@backend/modulos/banners/queries'
import { buscarCategorias }          from '@backend/modulos/categorias/queries'
import { buscarProdutosDestaque }    from '@backend/modulos/produtos/queries'
import { buscarConfiguracoes }       from '@backend/modulos/configuracoes/queries'
import { SecaoHero }                 from '@frontend/publico/home/SecaoHero'
import { SecaoCategorias }           from '@frontend/publico/home/SecaoCategorias'
import { SecaoProdutosDestaque }     from '@frontend/publico/home/SecaoProdutosDestaque'
import { SecaoCicloEntrega }         from '@frontend/publico/home/SecaoCicloEntrega'

// ── Metadata da Página ────────────────────────────────────────
export const metadata: Metadata = {
  title: "Felipe's Bakery — Padaria Artesanal de Fermentação Natural",
  description:
    'Pães artesanais com fermentação natural, ciabattas, focaccias e folhados feitos com ingredientes selecionados. Peça até quarta-feira, receba na sexta-feira.',
}

// ── Revalidação ISR ───────────────────────────────────────────
// Revalida a cada 1 hora — cardápio não muda com frequência
export const revalidate = 3600

// ── Página ────────────────────────────────────────────────────
export default async function PaginaHome() {
  // Busca todos os dados em paralelo para minimizar o tempo de carregamento
  const [banners, categorias, produtosDestaque, configuracoes] = await Promise.all([
    buscarBanners(),
    buscarCategorias(),
    buscarProdutosDestaque(6),
    buscarConfiguracoes(),
  ])

  return (
    <>
      {/* 1. Banner principal */}
      <SecaoHero banners={banners} />

      {/* 2. Grid de categorias */}
      <SecaoCategorias categorias={categorias} />

      {/* 3. Produtos em destaque */}
      <SecaoProdutosDestaque produtos={produtosDestaque} />

      {/* 4. Como funciona o ciclo de pedidos */}
      <SecaoCicloEntrega configuracoes={configuracoes} />
    </>
  )
}
