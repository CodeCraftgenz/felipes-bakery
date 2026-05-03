/**
 * Seed de Desenvolvimento — Felipe's Bakery
 *
 * Popula o banco com dados reais do cardápio para uso em desenvolvimento e
 * no primeiro deploy em produção.
 *
 * O que este seed cria:
 *   1. Usuário admin master (Felipe)
 *   2. Configurações iniciais da loja
 *   3. Categorias do cardápio (Pães Rústicos, Semi-Integral, Folhado Artesanal)
 *   4. Produtos reais do cardápio com preços reais
 *   5. Estoque inicial de 20 unidades por produto
 *   6. Banner inicial da home
 *   7. Cliente de teste (apenas em desenvolvimento)
 *
 * Uso:
 *   npm run db:seed
 *
 * Segurança:
 *   - O cliente de teste só é criado em NODE_ENV=development
 *   - Senhas nunca em texto plano — bcrypt com cost factor 12
 *   - Em produção, trocar as senhas via variáveis de ambiente
 */

import { drizzle }  from 'drizzle-orm/mysql2'
import mysql        from 'mysql2/promise'
import bcrypt       from 'bcryptjs'
import { eq }       from 'drizzle-orm'
import { config }   from 'dotenv'
import * as schema  from '../schema'

// Carrega variáveis de ambiente
config({ path: '.env.local' })

// Desestrutura as tabelas necessárias
const {
  usuarios,
  clientes,
  categorias,
  produtos,
  imagensProduto,
  estoque,
  configuracoes,
  banners,
} = schema

/**
 * Função principal do seed.
 * Usa upsert (INSERT ... ON DUPLICATE KEY UPDATE) para ser idempotente —
 * pode ser executado múltiplas vezes sem duplicar dados.
 */
async function executarSeed() {
  console.log('\n🌱 Iniciando seed da Felipe\'s Bakery...')
  console.log('═══════════════════════════════════════\n')

  // Cria pool de conexão com o banco
  const pool = await mysql.createPool({
    uri:             process.env.DATABASE_URL!,
    connectionLimit: 5,
  })

  const db = drizzle(pool, { schema, mode: 'default' })

  // ── 1. Usuário Admin ────────────────────────────────────
  console.log('👤 Criando usuário administrador...')

  const senhaAdmin    = process.env.SEED_ADMIN_PASSWORD || 'Admin@Felipe2026!'
  const hashSenhaAdmin = await bcrypt.hash(senhaAdmin, 12)

  await db.insert(usuarios).values({
    email:     process.env.SEED_ADMIN_EMAIL || 'admin@felipesbakery.com.br',
    senhaHash: hashSenhaAdmin,
    nome:      process.env.SEED_ADMIN_NAME  || 'Felipe',
    papel:     'admin_master',
    ativo:     1,
  }).onDuplicateKeyUpdate({
    set: { nome: process.env.SEED_ADMIN_NAME || 'Felipe' },
  })

  console.log(`  ✅ Admin: ${process.env.SEED_ADMIN_EMAIL || 'admin@felipesbakery.com.br'}`)

  // ── 2. Configurações da Loja ────────────────────────────
  console.log('\n⚙️  Configurando parâmetros da loja...')

  await db.insert(configuracoes).values({
    id:           1,
    nomeLoja:     "Felipe's Bakery",
    whatsapp:     '5516997684430',
    telefone:     '(16) 997 684 430',
    emailContato: 'contato@felipesbakery.com.br',
    // Ciclo padrão: pedidos até quarta-feira 23h, entrega na sexta
    diaCorte:     3,  // Quarta-feira
    horaCorte:    23, // 23h
    diaEntrega:   5,  // Sexta-feira
    taxaFrete:    '0.00',
    modoManutencao: 0,
  }).onDuplicateKeyUpdate({
    set: { nomeLoja: "Felipe's Bakery" },
  })

  console.log('  ✅ Ciclo: pedido até Quarta 23h, entrega Sexta')

  // ── 3. Categorias do Cardápio ───────────────────────────
  console.log('\n📂 Criando categorias...')

  const dadosCategorias = [
    {
      nome:          'Pães Rústicos',
      slug:          'paes-rusticos',
      descricao:     'Pães de fermentação natural com crosta crocante e miolo alveolado. Produção artesanal com ingredientes selecionados.',
      ordemExibicao: 1,
      ativa:         1 as const,
    },
    {
      nome:          'Semi-Integral',
      slug:          'semi-integral',
      descricao:     'Pães com farinha semi-integral, textura macia e notas tostadas.',
      ordemExibicao: 2,
      ativa:         1 as const,
    },
    {
      nome:          'Folhado Artesanal',
      slug:          'folhado-artesanal',
      descricao:     'Croissants e folhados com fermentação lenta e manteiga de qualidade.',
      ordemExibicao: 3,
      ativa:         1 as const,
    },
  ]

  // Mapeia slug → id para uso nos produtos
  const idsPorSlug: Record<string, number> = {}

  for (const cat of dadosCategorias) {
    await db.insert(categorias).values(cat)
      .onDuplicateKeyUpdate({ set: { nome: cat.nome } })

    const [encontrada] = await db
      .select({ id: categorias.id })
      .from(categorias)
      .where(eq(categorias.slug, cat.slug))
      .limit(1)

    if (encontrada) {
      idsPorSlug[cat.slug] = encontrada.id
      console.log(`  ✅ ${cat.nome} (id: ${encontrada.id})`)
    }
  }

  // ── 4. Produtos do Cardápio ─────────────────────────────
  console.log('\n🍞 Criando produtos do cardápio...')

  const dadosProdutos = [
    // ── Pães Rústicos ─────────────────────────────────────
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Pão Italiano',
      slug:            'pao-italiano',
      descricao:       'Clássico, neutro e versátil: vai bem com tudo. Fermentação natural longa para um miolo leve e crosta crocante.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural (levain)',
      pesoGramas:      450,
      preco:           '15.50',
      emDestaque:      1 as const,
      // Pão sourdough dourado (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1387070/pexels-photo-1387070.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Campagne Grãos & Azeitona',
      slug:            'campagne-graos-azeitona',
      descricao:       'Abóbora, girassol e azeitona Azapa. Combinação única com textura rica e sabor marcante.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, sementes de abóbora, sementes de girassol, azeitona Azapa',
      pesoGramas:      600,
      preco:           '27.00',
      emDestaque:      1 as const,
      // Pães variados em prateleira (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/2523650/pexels-photo-2523650.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Pão Cacau & Chocolate',
      slug:            'pao-cacau-chocolate',
      descricao:       'Miolo úmido, sedoso e levemente rústico.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate',
      pesoGramas:      600,
      preco:           '30.00',
      emDestaque:      1 as const,
      // Pão artesanal fatiado (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Pão Cacau Chocolate & Laranja',
      slug:            'pao-cacau-chocolate-laranja',
      descricao:       'Miolo úmido, um toque cítrico e levemente rústico.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate, raspas de laranja',
      pesoGramas:      600,
      preco:           '30.00',
      emDestaque:      0 as const,
      // Padaria artesanal iluminada (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Ciabatta Tradicional',
      slug:            'ciabatta-tradicional',
      descricao:       'Casca crocante, miolo alveolado. Ideal para bruschettas.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, azeite de oliva',
      pesoGramas:      300,
      preco:           '15.00',
      emDestaque:      0 as const,
      // Vitrine de padaria (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1028637/pexels-photo-1028637.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Ciabatta com Nozes',
      slug:            'ciabatta-com-nozes',
      descricao:       'Sabor intenso, textura suave.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, azeite de oliva, nozes',
      pesoGramas:      330,
      preco:           '18.00',
      emDestaque:      0 as const,
      // Café da manhã com pão (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Ciabatta com Azeitona',
      slug:            'ciabatta-com-azeitona',
      descricao:       'Textura irresistível e miolo cheio de sabor.',
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, azeite de oliva, azeitonas',
      pesoGramas:      330,
      preco:           '18.00',
      emDestaque:      0 as const,
      // Padeiro preparando massa (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/3218467/pexels-photo-3218467.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'paes-rusticos',
      nome:            'Focaccia Azeitona & Tomate Confit',
      slug:            'focaccia-azeitona-tomate-confit',
      descricao:       "Massa leve e crocante, azeitona Azapa e tomate confitado da casa. A focaccia premium da Felipe's.",
      ingredientes:    'Farinha de trigo, água, sal, fermento natural, azeite de oliva extra-virgem, azeitona Azapa, tomate confit',
      pesoGramas:      450,
      preco:           '30.00',
      emDestaque:      1 as const,
      // Mesa de padaria premium (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    // ── Semi-Integral ──────────────────────────────────────
    {
      categoriaSlug:   'semi-integral',
      nome:            'Semi-integral com Sementes',
      slug:            'semi-integral-com-sementes',
      descricao:       'Textura macia, crosta fina e notas tostadas.',
      ingredientes:    'Farinha semi-integral, farinha de trigo, água, sal, fermento natural, mix de sementes',
      pesoGramas:      600,
      preco:           '18.00',
      emDestaque:      0 as const,
      // Sovando massa (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/9095/pexels-photo-9095.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
    // ── Folhado Artesanal ──────────────────────────────────
    {
      categoriaSlug:   'folhado-artesanal',
      nome:            'Croissant Tradicional',
      slug:            'croissant-tradicional',
      descricao:       "Massa crocante, fermentação lenta, manteiga de qualidade. O croissant artesanal da Felipe's.",
      ingredientes:    'Farinha de trigo, manteiga, leite, ovos, açúcar, sal, fermento biológico',
      pesoGramas:      null,
      preco:           '12.00',
      emDestaque:      1 as const,
      // Croissants clássicos (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    {
      categoriaSlug:   'folhado-artesanal',
      nome:            'Kouign-amann',
      slug:            'kouign-amann',
      descricao:       'Especialidade da Bretanha. Doce amanteigado com casquinha crocante e interior caramelizado.',
      ingredientes:    'Farinha de trigo, manteiga, açúcar, sal, fermento biológico',
      pesoGramas:      60,
      preco:           '12.00',
      emDestaque:      0 as const,
      // Croissants em bandeja (Pexels)
      imagemUrl:       'https://images.pexels.com/photos/1998635/pexels-photo-1998635.jpeg?auto=compress&cs=tinysrgb&w=1280',
    },
  ]

  for (const prod of dadosProdutos) {
    const categoriaId = idsPorSlug[prod.categoriaSlug]
    if (!categoriaId) {
      console.warn(`  ⚠️  Categoria não encontrada: ${prod.categoriaSlug}`)
      continue
    }

    // Remove os campos auxiliares antes de inserir no banco
    const { categoriaSlug, imagemUrl, ...dadosInsercao } = prod

    await db.insert(produtos).values({
      ...dadosInsercao,
      categoriaId,
      ativo:   1,
      status:  'published',
    }).onDuplicateKeyUpdate({
      set: { preco: prod.preco },
    })

    // Busca o ID do produto para criar estoque e imagem
    const [inserido] = await db
      .select({ id: produtos.id })
      .from(produtos)
      .where(eq(produtos.slug, prod.slug))
      .limit(1)

    if (inserido) {
      // Cria registro de estoque com 20 unidades iniciais
      await db.insert(estoque).values({
        produtoId:    inserido.id,
        quantidade:   20,
        alertaMinimo: 3,
      }).onDuplicateKeyUpdate({
        set: { quantidade: 20 },
      })

      // Insere imagem principal via tabela product_images (idempotente)
      if (imagemUrl) {
        const [imagemExistente] = await db
          .select({ id: imagensProduto.id })
          .from(imagensProduto)
          .where(eq(imagensProduto.produtoId, inserido.id))
          .limit(1)

        if (!imagemExistente) {
          await db.insert(imagensProduto).values({
            produtoId:        inserido.id,
            url:              imagemUrl,
            textoAlternativo: prod.nome,
            ordemExibicao:    0,
            principal:        1,
          })
        }
      }

      console.log(`  ✅ ${prod.nome} — R$ ${prod.preco}`)
    }
  }

  // ── 5. Banners da Home ──────────────────────────────────
  console.log('\n🖼️  Criando banners da home...')

  // Banner 1 — mesa de padaria premium (wide, Pexels)
  await db.insert(banners).values({
    titulo:        'Pães artesanais de fermentação natural',
    urlImagem:     'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1920',
    urlLink:       '/catalogo',
    ordemExibicao: 1,
    ativo:         1,
  }).onDuplicateKeyUpdate({
    set: { urlImagem: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  })

  // Banner 2 — padaria artesanal iluminada (wide, Pexels)
  await db.insert(banners).values({
    titulo:        'Feitos com amor e ingredientes selecionados',
    urlImagem:     'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=1920',
    urlLink:       '/catalogo',
    ordemExibicao: 2,
    ativo:         1,
  }).onDuplicateKeyUpdate({
    set: { urlImagem: 'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  })

  console.log('  ✅ Banner 1: mesa de padaria premium')
  console.log('  ✅ Banner 2: padaria artesanal iluminada')

  // ── 6. Cliente de Teste (apenas em desenvolvimento) ─────
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🧑 Criando cliente de teste (somente dev)...')

    const hashSenhaCliente = await bcrypt.hash('Cliente@123', 12)

    await db.insert(clientes).values({
      email:                  'cliente@teste.com.br',
      senhaHash:              hashSenhaCliente,
      nome:                   'Cliente Teste',
      telefone:               '(16) 99999-9999',
      emailVerificado:        1,
      ativo:                  1,
      consentimentoMarketing: 1,
    }).onDuplicateKeyUpdate({
      set: { nome: 'Cliente Teste' },
    })

    console.log('  ✅ cliente@teste.com.br / Cliente@123')
  }

  // ── Resumo Final ────────────────────────────────────────
  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('═══════════════════════════════════════')
  console.log(`  Admin:    ${process.env.SEED_ADMIN_EMAIL || 'admin@felipesbakery.com.br'}`)
  console.log(`  Senha:    ${senhaAdmin}`)
  if (process.env.NODE_ENV === 'development') {
    console.log('  Cliente:  cliente@teste.com.br / Cliente@123')
  }
  console.log('═══════════════════════════════════════\n')

  await pool.end()
  process.exit(0)
}

// Executa o seed e trata erros fatais
executarSeed().catch((erro) => {
  console.error('\n❌ Erro durante o seed:', erro)
  process.exit(1)
})
