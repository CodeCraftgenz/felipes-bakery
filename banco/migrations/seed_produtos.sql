-- ============================================================
-- SEED COMPLETO — Felipe's Bakery
-- Execute este script no phpMyAdmin para popular o banco.
-- Seguro rodar mais de uma vez (usa INSERT IGNORE / ON DUPLICATE KEY).
-- ============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ── 1. Usuário Admin ─────────────────────────────────────────
-- Senha: Admin@2026!
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'admin@felipesbakery.com.br',
  '$2a$12$.jA7QlCzYfCwrffhJKYasuIztqhNYV3JYWaOsnm//3G0LevKyBM7q',
  'Felipe',
  'admin_master',
  1
)
ON DUPLICATE KEY UPDATE name = 'Felipe';

-- ── 2. Configurações da Loja ─────────────────────────────────
INSERT INTO store_settings
  (id, store_name, store_whatsapp, store_phone, store_email,
   order_cutoff_day, order_cutoff_hour, delivery_day, shipping_fee, maintenance_mode)
VALUES
  (1, 'Felipe''s Bakery', '5516997684430', '(16) 99768-4430',
   'contato@felipesbakery.com.br', 3, 23, 5, '0.00', 0)
ON DUPLICATE KEY UPDATE store_name = 'Felipe''s Bakery';

-- ── 3. Categorias ────────────────────────────────────────────
INSERT INTO categories (name, slug, description, display_order, is_active)
VALUES
  ('Pães Rústicos',    'paes-rusticos',    'Pães de fermentação natural com crosta crocante e miolo alveolado.', 1, 1),
  ('Semi-Integral',    'semi-integral',    'Pães com farinha semi-integral, textura macia e notas tostadas.',  2, 1),
  ('Folhado Artesanal','folhado-artesanal','Croissants e folhados com fermentação lenta e manteiga de qualidade.', 3, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── 4. Produtos ───────────────────────────────────────────────
-- Busca os IDs das categorias dinâmicamente
SET @cat_rusticos  = (SELECT id FROM categories WHERE slug = 'paes-rusticos'    LIMIT 1);
SET @cat_integral  = (SELECT id FROM categories WHERE slug = 'semi-integral'     LIMIT 1);
SET @cat_folhado   = (SELECT id FROM categories WHERE slug = 'folhado-artesanal' LIMIT 1);

INSERT INTO products
  (category_id, name, slug, description, ingredients, weight_grams, price, is_active, is_featured, status)
VALUES
  -- Pães Rústicos
  (@cat_rusticos, 'Pão Italiano', 'pao-italiano',
   'Clássico, neutro e versátil: vai bem com tudo. Fermentação natural longa para um miolo leve e crosta crocante.',
   'Farinha de trigo, água, sal, fermento natural (levain)',
   450, 15.50, 1, 1, 'published'),

  (@cat_rusticos, 'Campagne Grãos & Azeitona', 'campagne-graos-azeitona',
   'Abóbora, girassol e azeitona Azapa. Combinação única com textura rica e sabor marcante.',
   'Farinha de trigo, água, sal, fermento natural, sementes de abóbora, sementes de girassol, azeitona Azapa',
   600, 27.00, 1, 1, 'published'),

  (@cat_rusticos, 'Pão Cacau & Chocolate', 'pao-cacau-chocolate',
   'Miolo úmido, sedoso e levemente rústico. Combinação irresistível de cacau e chocolate.',
   'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate',
   600, 30.00, 1, 1, 'published'),

  (@cat_rusticos, 'Pão Cacau Chocolate & Laranja', 'pao-cacau-chocolate-laranja',
   'Miolo úmido, um toque cítrico e levemente rústico. A acidez da laranja equilibra o amargor do cacau.',
   'Farinha de trigo, água, sal, fermento natural, cacau em pó, gotas de chocolate, raspas de laranja',
   600, 30.00, 1, 0, 'published'),

  (@cat_rusticos, 'Ciabatta Tradicional', 'ciabatta-tradicional',
   'Casca crocante, miolo alveolado. Ideal para bruschettas e sanduíches gourmet.',
   'Farinha de trigo, água, sal, fermento natural, azeite de oliva',
   300, 15.00, 1, 0, 'published'),

  (@cat_rusticos, 'Ciabatta com Nozes', 'ciabatta-com-nozes',
   'Sabor intenso, textura suave. As nozes adicionam crocância e profundidade ao clássico italiano.',
   'Farinha de trigo, água, sal, fermento natural, azeite de oliva, nozes',
   330, 18.00, 1, 0, 'published'),

  (@cat_rusticos, 'Ciabatta com Azeitona', 'ciabatta-com-azeitona',
   'Textura irresistível e miolo cheio de sabor. Azeitonas distribuídas em cada fatia.',
   'Farinha de trigo, água, sal, fermento natural, azeite de oliva, azeitonas',
   330, 18.00, 1, 0, 'published'),

  (@cat_rusticos, 'Focaccia Azeitona & Tomate Confit', 'focaccia-azeitona-tomate-confit',
   'Massa leve e crocante, azeitona Azapa e tomate confitado da casa.',
   'Farinha de trigo, água, sal, fermento natural, azeite de oliva extra-virgem, azeitona Azapa, tomate confit',
   450, 30.00, 1, 1, 'published'),

  -- Semi-Integral
  (@cat_integral, 'Semi-integral com Sementes', 'semi-integral-com-sementes',
   'Textura macia, crosta fina e notas tostadas. Farinha semi-integral com mix de sementes.',
   'Farinha semi-integral, farinha de trigo, água, sal, fermento natural, mix de sementes (girassol, linhaça, gergelim)',
   600, 18.00, 1, 0, 'published'),

  -- Folhado Artesanal
  (@cat_folhado, 'Croissant Tradicional', 'croissant-tradicional',
   'Massa crocante, fermentação lenta, manteiga de qualidade. Camadas perfeitas e sabor amanteigado.',
   'Farinha de trigo, manteiga, leite, ovos, açúcar, sal, fermento biológico',
   NULL, 12.00, 1, 1, 'published'),

  (@cat_folhado, 'Kouign-amann', 'kouign-amann',
   'Especialidade da Bretanha. Doce amanteigado com casquinha crocante, interior macio e caramelizado.',
   'Farinha de trigo, manteiga, açúcar, sal, fermento biológico',
   60, 12.00, 1, 0, 'published')

ON DUPLICATE KEY UPDATE price = VALUES(price), status = 'published';

-- ── 5. Imagens dos Produtos (Pexels — alta qualidade) ─────────
-- Cada produto recebe sua foto artesanal correspondente

INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary)
SELECT p.id,
       img.url,
       img.alt,
       0,
       1
FROM products p
JOIN (
  SELECT 'pao-italiano'                   AS slug, 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800' AS url, 'Pão italiano artesanal com crosta crocante'   AS alt UNION ALL
  SELECT 'campagne-graos-azeitona',               'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=800', 'Pão campagne com grãos e azeitona'            UNION ALL
  SELECT 'pao-cacau-chocolate',                   'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=800', 'Pão de cacau e chocolate artesanal'           UNION ALL
  SELECT 'pao-cacau-chocolate-laranja',           'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800', 'Pão de cacau com laranja artesanal'           UNION ALL
  SELECT 'ciabatta-tradicional',                  'https://images.pexels.com/photos/1927377/pexels-photo-1927377.jpeg?auto=compress&cs=tinysrgb&w=800', 'Ciabatta italiana artesanal'                  UNION ALL
  SELECT 'ciabatta-com-nozes',                    'https://images.pexels.com/photos/1756025/pexels-photo-1756025.jpeg?auto=compress&cs=tinysrgb&w=800', 'Ciabatta com nozes artesanal'                 UNION ALL
  SELECT 'ciabatta-com-azeitona',                 'https://images.pexels.com/photos/3926124/pexels-photo-3926124.jpeg?auto=compress&cs=tinysrgb&w=800', 'Ciabatta com azeitona artesanal'              UNION ALL
  SELECT 'focaccia-azeitona-tomate-confit',       'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=800', 'Focaccia com azeitona e tomate confit'        UNION ALL
  SELECT 'semi-integral-com-sementes',            'https://images.pexels.com/photos/1586947/pexels-photo-1586947.jpeg?auto=compress&cs=tinysrgb&w=800', 'Pão semi-integral com sementes'               UNION ALL
  SELECT 'croissant-tradicional',                 'https://images.pexels.com/photos/1510682/pexels-photo-1510682.jpeg?auto=compress&cs=tinysrgb&w=800', 'Croissant artesanal dourado e folhado'        UNION ALL
  SELECT 'kouign-amann',                          'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800', 'Kouign-amann caramelizado'
) img ON p.slug = img.slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
);

-- ── 6. Estoque (20 unidades por produto) ─────────────────────
INSERT INTO stock (product_id, quantity, min_quantity_alert)
SELECT id, 20, 3
FROM products
WHERE deleted_at IS NULL
ON DUPLICATE KEY UPDATE quantity = 20;

-- ── 7. Banner Principal ───────────────────────────────────────
INSERT INTO banners (title, image_url, link_url, display_order, is_active)
VALUES (
  'Pães artesanais de fermentação natural',
  'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1600',
  '/catalogo',
  1,
  1
)
ON DUPLICATE KEY UPDATE title = 'Pães artesanais de fermentação natural';

SET foreign_key_checks = 1;

-- ✅ Seed concluído!
-- Admin: admin@felipesbakery.com.br / Admin@2026!
-- 11 produtos, 3 categorias, estoque e banner criados.
