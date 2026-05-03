/**
 * Seed de desenvolvimento — Felipe's Bakery
 * Popula o banco com dados reais do cardápio e um usuário admin
 *
 * Uso: npm run db:seed
 */

import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

config({ path: '.env.local' })

const {
  users,
  customers,
  categories,
  products,
  productImages,
  stock,
  storeSettings,
  banners,
} = schema

async function seed() {
  console.log('🌱 Iniciando seed da Felipe\'s Bakery...\n')

  const pool = await mysql.createPool({
    uri: process.env.DATABASE_URL!,
    connectionLimit: 5,
  })

  const db = drizzle(pool, { schema, mode: 'default' })

  // ─── 1. Usuário Admin ──────────────────────────────────
  console.log('👤 Criando usuário admin...')
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@Felipe2026!'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await db.insert(users).values({
    email:        process.env.SEED_ADMIN_EMAIL || 'admin@felipesbakery.com.br',
    passwordHash,
    name:         process.env.SEED_ADMIN_NAME || 'Felipe',
    role:         'admin_master',
    isActive:     1,
  }).onDuplicateKeyUpdate({
    set: { name: process.env.SEED_ADMIN_NAME || 'Felipe' },
  })
  console.log('  ✅ Admin criado: admin@felipesbakery.com.br')

  // ─── 2. Configurações da Loja ─────────────────────────
  console.log('\n⚙️  Configurando loja...')
  await db.insert(storeSettings).values({
    id:              1,
    storeName:       "Felipe's Bakery",
    storeWhatsapp:   '5516997684430',
    storePhone:      '(16) 997 684 430',
    storeEmail:      'contato@felipesbakery.com.br',
    orderCutoffDay:  3,  // Quarta-feira
    orderCutoffHour: 23, // 23h
    deliveryDay:     5,  // Sexta-feira
    shippingFee:     '0.00',
    maintenanceMode: 0,
  }).onDuplicateKeyUpdate({
    set: { storeName: "Felipe's Bakery" },
  })
  console.log('  ✅ Configurações da loja salvas')

  // ─── 3. Categorias ────────────────────────────────────
  console.log('\n📂 Criando categorias...')
  const categoryData = [
    {
      name:         'Pães Rústicos',
      slug:         'paes-rusticos',
      description:  'Pães de fermentação natural com crosta crocante e miolo alveolado. Produção artesanal com ingredientes selecionados.',
      displayOrder: 1,
      isActive:     1 as const,
    },
    {
      name:         'Semi-Integral',
      slug:         'semi-integral',
      description:  'Pães com farinha semi-integral, textura macia e notas tostadas.',
      displayOrder: 2,
      isActive:     1 as const,
    },
    {
      name:         'Folhado Artesanal',
      slug:         'folhado-artesanal',
      description:  'Croissants e folhados feitos com fermentação lenta e manteiga de qualidade.',
      displayOrder: 3,
      isActive:     1 as const,
    },
  ]

  const insertedCategories: Record<string, number> = {}

  for (const cat of categoryData) {
    const [result] = await db.insert(categories).values(cat)
      .onDuplicateKeyUpdate({ set: { name: cat.name } })
    // Busca o ID da categoria pelo slug
    const [found] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, cat.slug))
      .limit(1)
    if (found) {
      insertedCategories[cat.slug] = found.id
      console.log(`  ✅ Categoria: ${cat.name} (id: ${found.id})`)
    }
  }

  // ─── 4. Produtos ──────────────────────────────────────
  console.log('\n🍞 Criando produtos do cardápio...')

  const productData = [
    // ── Pães Rústicos ───────────────────────────────────
    {
      categorySlug: 'paes-rusticos',
      name:         'Pão Italiano',
      slug:         'pao-italiano',
      description:  'Clássico, neutro e versátil: vai bem com tudo. Fermentação natural longa para um miolo leve e crosta crocante.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural (levain)',
      weightGrams:  450,
      price:        '15.50',
      isFeatured:   1 as const,
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Campagne Grãos & Azeitona',
      slug:         'campagne-graos-azeitona',
      description:  'Abóbora, girassol e azeitona Azapa. Combinação única com textura rica e sabor marcante.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, sementes de abóbora, sementes de girassol, azeitona Azapa',
      weightGrams:  600,
      price:        '27.00',
      isFeatured:   1 as const,
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Pão Cacau & Chocolate',
      slug:         'pao-cacau-chocolate',
      description:  'Miolo úmido, sedoso e levemente rústico. Combinação irresistível de cacau e chocolate no pão de fermentação natural.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate',
      weightGrams:  600,
      price:        '30.00',
      isFeatured:   1 as const,
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Pão Cacau Chocolate & Laranja',
      slug:         'pao-cacau-chocolate-laranja',
      description:  'Miolo úmido, um toque cítrico e levemente rústico. A acidez da laranja equilibra o amargor do cacau.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate, raspas de laranja',
      weightGrams:  600,
      price:        '30.00',
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Ciabatta Tradicional',
      slug:         'ciabatta-tradicional',
      description:  'Casca crocante, miolo alveolado. Ideal para bruschettas e sanduíches gourmet.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, azeite de oliva',
      weightGrams:  300,
      price:        '15.00',
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Ciabatta com Nozes',
      slug:         'ciabatta-com-nozes',
      description:  'Sabor intenso, textura suave. As nozes adicionam crocância e profundidade ao clássico italiano.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, azeite de oliva, nozes',
      weightGrams:  330,
      price:        '18.00',
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Ciabatta com Azeitona',
      slug:         'ciabatta-com-azeitona',
      description:  'Textura irresistível e miolo cheio de sabor. Azeitonas distribuídas em cada fatia.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, azeite de oliva, azeitonas',
      weightGrams:  330,
      price:        '18.00',
      status:       'published' as const,
    },
    {
      categorySlug: 'paes-rusticos',
      name:         'Focaccia Azeitona & Tomate Confit',
      slug:         'focaccia-azeitona-tomate-confit',
      description:  'Massa leve e crocante, azeitona Azapa e tomate confitado da casa. A focaccia premium da Felipe\'s.',
      ingredients:  'Farinha de trigo, água, sal, fermento natural, azeite de oliva extra-virgem, azeitona Azapa, tomate confit',
      weightGrams:  450,
      price:        '30.00',
      isFeatured:   1 as const,
      status:       'published' as const,
    },
    // ── Semi-Integral ───────────────────────────────────
    {
      categorySlug: 'semi-integral',
      name:         'Semi-integral com Sementes',
      slug:         'semi-integral-com-sementes',
      description:  'Textura macia, crosta fina e notas tostadas. Farinha semi-integral com mix de sementes para um pão nutritivo e saboroso.',
      ingredients:  'Farinha semi-integral, farinha de trigo, água, sal, fermento natural, mix de sementes (girassol, linhaça, gergelim)',
      weightGrams:  600,
      price:        '18.00',
      status:       'published' as const,
    },
    // ── Folhado Artesanal ───────────────────────────────
    {
      categorySlug: 'folhado-artesanal',
      name:         'Croissant Tradicional',
      slug:         'croissant-tradicional',
      description:  'Massa crocante, fermentação lenta, manteiga de qualidade. O croissant artesanal da Felipe\'s: camadas perfeitas e sabor amanteigado.',
      ingredients:  'Farinha de trigo, manteiga, leite, ovos, açúcar, sal, fermento biológico',
      weightGrams:  null,
      price:        '12.00',
      isFeatured:   1 as const,
      status:       'published' as const,
    },
    {
      categorySlug: 'folhado-artesanal',
      name:         'Kouign-amann',
      slug:         'kouign-amann',
      description:  'Especialidade da Bretanha. Doce amanteigado com casquinha crocante, interior macio e caramelizado.',
      ingredients:  'Farinha de trigo, manteiga, açúcar, sal, fermento biológico',
      weightGrams:  60,
      price:        '12.00',
      status:       'published' as const,
    },
  ]

  for (const prod of productData) {
    const categoryId = insertedCategories[prod.categorySlug]
    if (!categoryId) {
      console.warn(`  ⚠️  Categoria não encontrada: ${prod.categorySlug}`)
      continue
    }

    const { categorySlug, ...productValues } = prod
    await db.insert(products).values({
      ...productValues,
      categoryId,
      isActive:   1,
      isFeatured: prod.isFeatured ?? 0,
    }).onDuplicateKeyUpdate({
      set: { price: prod.price },
    })

    // Busca o produto inserido para criar estoque
    const [inserted] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, prod.slug))
      .limit(1)

    if (inserted) {
      // Cria entrada de estoque com quantidade inicial = 20
      await db.insert(stock).values({
        productId:        inserted.id,
        quantity:         20,
        minQuantityAlert: 3,
      }).onDuplicateKeyUpdate({
        set: { quantity: 20 },
      })
      console.log(`  ✅ ${prod.name} — R$ ${prod.price}`)
    }
  }

  // ─── 5. Banner Inicial ────────────────────────────────
  console.log('\n🖼️  Criando banner inicial...')
  await db.insert(banners).values({
    title:        'Pães artesanais de fermentação natural',
    imageUrl:     '/images/hero-banner-placeholder.jpg',
    linkUrl:      '/catalogo',
    displayOrder: 1,
    isActive:     1,
  }).onDuplicateKeyUpdate({
    set: { title: 'Pães artesanais de fermentação natural' },
  })
  console.log('  ✅ Banner inicial criado')

  // ─── 6. Cliente de teste (dev only) ───────────────────
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🧑 Criando cliente de teste (dev)...')
    const clientPassword = await bcrypt.hash('Cliente@123', 12)
    await db.insert(customers).values({
      email:           'cliente@teste.com.br',
      passwordHash:    clientPassword,
      name:            'Cliente Teste',
      phone:           '(16) 99999-9999',
      emailVerified:   1,
      isActive:        1,
      marketingOptIn:  1,
    }).onDuplicateKeyUpdate({
      set: { name: 'Cliente Teste' },
    })
    console.log('  ✅ Cliente de teste: cliente@teste.com.br / Cliente@123')
  }

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('──────────────────────────────────')
  console.log(`Admin:   admin@felipesbakery.com.br`)
  console.log(`Senha:   ${adminPassword}`)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cliente: cliente@teste.com.br / Cliente@123`)
  }
  console.log('──────────────────────────────────\n')

  await pool.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err)
  process.exit(1)
})
