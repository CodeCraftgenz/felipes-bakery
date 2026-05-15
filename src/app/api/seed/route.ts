/**
 * Rota de seed — popula o banco com produtos, categorias e admin
 * Protegida por SETUP_SECRET. Idempotente: pode ser chamada mais de uma vez.
 *
 * Uso: GET /api/seed?secret=SUA_SETUP_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq }                        from 'drizzle-orm'
import bcrypt                        from 'bcryptjs'
import { db }                        from '@backend/lib/banco'
import {
  usuarios,
  categorias,
  produtos,
  imagensProduto,
  estoque,
  configuracoes,
  banners,
}                                    from '@schema'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret      = req.nextUrl.searchParams.get('secret')
  const setupSecret = process.env.SETUP_SECRET

  if (!setupSecret || secret !== setupSecret) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const log: string[] = []

  try {
    // ── 1. Usuário Admin ─────────────────────────────────
    const adminPassword = process.env.SEED_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json(
        { erro: 'SEED_ADMIN_PASSWORD não definida' },
        { status: 500 },
      )
    }
    const senhaHash     = await bcrypt.hash(adminPassword, 12)

    await db.insert(usuarios).values({
      email:    'admin@felipesbakery.com.br',
      senhaHash,
      nome:     'Felipe',
      papel:    'admin_master',
      ativo:    1,
    }).onDuplicateKeyUpdate({ set: { nome: 'Felipe' } })

    log.push('✅ Admin: admin@felipesbakery.com.br')

    // ── 2. Configurações da Loja ─────────────────────────
    await db.insert(configuracoes).values({
      id:           1,
      nomeLoja:     "Felipe's Bakery",
      whatsapp:     '5516997684430',
      telefone:     '(16) 99768-4430',
      emailContato: 'contato@felipesbakery.com.br',
      diaCorte:     3,
      horaCorte:    23,
      diaEntrega:   5,
      taxaFrete:    '0.00',
      modoManutencao: 0,
    }).onDuplicateKeyUpdate({ set: { nomeLoja: "Felipe's Bakery" } })

    log.push('✅ Configurações da loja')

    // ── 3. Categorias ─────────────────────────────────────
    const catData = [
      {
        nome:         'Pães Rústicos',
        slug:         'paes-rusticos',
        descricao:    'Pães de fermentação natural com crosta crocante e miolo alveolado.',
        ordemExibicao: 1,
        ativa:        1 as const,
      },
      {
        nome:         'Semi-Integral',
        slug:         'semi-integral',
        descricao:    'Pães com farinha semi-integral, textura macia e notas tostadas.',
        ordemExibicao: 2,
        ativa:        1 as const,
      },
      {
        nome:         'Folhado Artesanal',
        slug:         'folhado-artesanal',
        descricao:    'Croissants e folhados com fermentação lenta e manteiga de qualidade.',
        ordemExibicao: 3,
        ativa:        1 as const,
      },
    ]

    const catIds: Record<string, number> = {}

    for (const cat of catData) {
      await db.insert(categorias).values(cat)
        .onDuplicateKeyUpdate({ set: { nome: cat.nome } })

      const [found] = await db
        .select({ id: categorias.id })
        .from(categorias)
        .where(eq(categorias.slug, cat.slug))
        .limit(1)

      if (found) {
        catIds[cat.slug] = found.id
        log.push(`✅ Categoria: ${cat.nome} (id ${found.id})`)
      }
    }

    // ── 4. Produtos ───────────────────────────────────────
    // Imagens: Pexels CDN (alta resolução, uso gratuito)
    const produtosData = [
      // ── Pães Rústicos ───────────────────────────────────
      {
        catSlug:     'paes-rusticos',
        nome:        'Pão Italiano',
        slug:        'pao-italiano',
        descricao:   'Clássico, neutro e versátil: vai bem com tudo. Fermentação natural longa para um miolo leve e crosta crocante.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural (levain)',
        pesoGramas:  450,
        preco:       '15.50',
        emDestaque:  1 as const,
        imageUrl:    'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Pão italiano artesanal com crosta crocante',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Campagne Grãos & Azeitona',
        slug:        'campagne-graos-azeitona',
        descricao:   'Abóbora, girassol e azeitona Azapa. Combinação única com textura rica e sabor marcante.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, sementes de abóbora, sementes de girassol, azeitona Azapa',
        pesoGramas:  600,
        preco:       '27.00',
        emDestaque:  1 as const,
        imageUrl:    'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Pão campagne com grãos e azeitona',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Pão Cacau & Chocolate',
        slug:        'pao-cacau-chocolate',
        descricao:   'Miolo úmido, sedoso e levemente rústico. Combinação irresistível de cacau e chocolate no pão de fermentação natural.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate',
        pesoGramas:  600,
        preco:       '30.00',
        emDestaque:  1 as const,
        imageUrl:    'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Pão de cacau e chocolate artesanal',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Pão Cacau Chocolate & Laranja',
        slug:        'pao-cacau-chocolate-laranja',
        descricao:   'Miolo úmido, um toque cítrico e levemente rústico. A acidez da laranja equilibra o amargor do cacau.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate, raspas de laranja',
        pesoGramas:  600,
        preco:       '30.00',
        emDestaque:  0 as const,
        imageUrl:    'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Pão de cacau com laranja artesanal',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Ciabatta Tradicional',
        slug:        'ciabatta-tradicional',
        descricao:   'Casca crocante, miolo alveolado. Ideal para bruschettas e sanduíches gourmet.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, azeite de oliva',
        pesoGramas:  300,
        preco:       '15.00',
        emDestaque:  0 as const,
        imageUrl:    'https://images.pexels.com/photos/1927377/pexels-photo-1927377.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Ciabatta italiana artesanal',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Ciabatta com Nozes',
        slug:        'ciabatta-com-nozes',
        descricao:   'Sabor intenso, textura suave. As nozes adicionam crocância e profundidade ao clássico italiano.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, azeite de oliva, nozes',
        pesoGramas:  330,
        preco:       '18.00',
        emDestaque:  0 as const,
        imageUrl:    'https://images.pexels.com/photos/1756025/pexels-photo-1756025.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Ciabatta com nozes artesanal',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Ciabatta com Azeitona',
        slug:        'ciabatta-com-azeitona',
        descricao:   'Textura irresistível e miolo cheio de sabor. Azeitonas distribuídas em cada fatia.',
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, azeite de oliva, azeitonas',
        pesoGramas:  330,
        preco:       '18.00',
        emDestaque:  0 as const,
        imageUrl:    'https://images.pexels.com/photos/3926124/pexels-photo-3926124.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Ciabatta com azeitona artesanal',
      },
      {
        catSlug:     'paes-rusticos',
        nome:        'Focaccia Azeitona & Tomate Confit',
        slug:        'focaccia-azeitona-tomate-confit',
        descricao:   "Massa leve e crocante, azeitona Azapa e tomate confitado da casa. A focaccia premium da Felipe's.",
        ingredientes: 'Farinha de trigo, água, sal, fermento natural, azeite de oliva extra-virgem, azeitona Azapa, tomate confit',
        pesoGramas:  450,
        preco:       '30.00',
        emDestaque:  1 as const,
        imageUrl:    'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Focaccia com azeitona e tomate confit',
      },
      // ── Semi-Integral ───────────────────────────────────
      {
        catSlug:     'semi-integral',
        nome:        'Semi-integral com Sementes',
        slug:        'semi-integral-com-sementes',
        descricao:   'Textura macia, crosta fina e notas tostadas. Farinha semi-integral com mix de sementes para um pão nutritivo e saboroso.',
        ingredientes: 'Farinha semi-integral, farinha de trigo, água, sal, fermento natural, mix de sementes (girassol, linhaça, gergelim)',
        pesoGramas:  600,
        preco:       '18.00',
        emDestaque:  0 as const,
        imageUrl:    'https://images.pexels.com/photos/1586947/pexels-photo-1586947.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Pão semi-integral com sementes',
      },
      // ── Folhado Artesanal ───────────────────────────────
      {
        catSlug:     'folhado-artesanal',
        nome:        'Croissant Tradicional',
        slug:        'croissant-tradicional',
        descricao:   "Massa crocante, fermentação lenta, manteiga de qualidade. O croissant artesanal da Felipe's: camadas perfeitas e sabor amanteigado.",
        ingredientes: 'Farinha de trigo, manteiga, leite, ovos, açúcar, sal, fermento biológico',
        pesoGramas:  null,
        preco:       '12.00',
        emDestaque:  1 as const,
        imageUrl:    'https://images.pexels.com/photos/1510682/pexels-photo-1510682.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Croissant artesanal dourado e folhado',
      },
      {
        catSlug:     'folhado-artesanal',
        nome:        'Kouign-amann',
        slug:        'kouign-amann',
        descricao:   'Especialidade da Bretanha. Doce amanteigado com casquinha crocante, interior macio e caramelizado.',
        ingredientes: 'Farinha de trigo, manteiga, açúcar, sal, fermento biológico',
        pesoGramas:  60,
        preco:       '12.00',
        emDestaque:  0 as const,
        imageUrl:    'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt:    'Kouign-amann caramelizado',
      },
    ]

    for (const prod of produtosData) {
      const categoriaId = catIds[prod.catSlug]
      if (!categoriaId) {
        log.push(`⚠️  Categoria não encontrada: ${prod.catSlug}`)
        continue
      }

      await db.insert(produtos).values({
        categoriaId,
        nome:        prod.nome,
        slug:        prod.slug,
        descricao:   prod.descricao,
        ingredientes: prod.ingredientes,
        pesoGramas:  prod.pesoGramas ?? undefined,
        preco:       prod.preco,
        ativo:       1,
        emDestaque:  prod.emDestaque,
        status:      'published',
      }).onDuplicateKeyUpdate({ set: { preco: prod.preco } })

      const [inserted] = await db
        .select({ id: produtos.id })
        .from(produtos)
        .where(eq(produtos.slug, prod.slug))
        .limit(1)

      if (!inserted) continue

      // Imagem principal — insere somente se não existir nenhuma
      const [imgExistente] = await db
        .select({ id: imagensProduto.id })
        .from(imagensProduto)
        .where(eq(imagensProduto.produtoId, inserted.id))
        .limit(1)

      if (!imgExistente) {
        await db.insert(imagensProduto).values({
          produtoId:        inserted.id,
          url:              prod.imageUrl,
          textoAlternativo: prod.imageAlt,
          ordemExibicao:    0,
          principal:        1,
        })
      }

      // Estoque
      await db.insert(estoque).values({
        produtoId:    inserted.id,
        quantidade:   20,
        alertaMinimo: 3,
      }).onDuplicateKeyUpdate({ set: { quantidade: 20 } })

      log.push(`✅ ${prod.nome} — R$ ${prod.preco}`)
    }

    // ── 5. Banner Principal ───────────────────────────────
    await db.insert(banners).values({
      titulo:        "Pães artesanais de fermentação natural",
      urlImagem:     'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1600',
      urlLink:       '/catalogo',
      ordemExibicao: 1,
      ativo:         1,
    }).onDuplicateKeyUpdate({ set: { titulo: "Pães artesanais de fermentação natural" } })

    log.push('✅ Banner principal')

    return NextResponse.json({
      ok:       true,
      mensagem: 'Seed concluído com sucesso!',
      log,
    })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    return NextResponse.json({ ok: false, erro: mensagem, log }, { status: 500 })
  }
}
