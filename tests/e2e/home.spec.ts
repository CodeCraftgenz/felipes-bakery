/**
 * Testes E2E — Página Home (Site Público)
 *
 * Verifica os elementos principais da página inicial:
 * hero, seção de categorias, produtos em destaque e rodapé.
 */

import { test, expect } from '@playwright/test'

test.describe('Página Home', () => {
  test('carrega e exibe o hero com título da padaria', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Felipe's Bakery/)
    // Título do hero
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('exibe o cabeçalho com link para catálogo', async ({ page }) => {
    await page.goto('/')
    // Link para catálogo no menu
    const linkCatalogo = page.getByRole('link', { name: /catálogo/i })
    await expect(linkCatalogo).toBeVisible()
  })

  test('botão do carrinho é visível no cabeçalho', async ({ page }) => {
    await page.goto('/')
    // Ícone de carrinho na navegação
    const btnCarrinho = page.locator('[href="/carrinho"]').first()
    await expect(btnCarrinho).toBeVisible()
  })

  test('exibe botão flutuante do WhatsApp', async ({ page }) => {
    await page.goto('/')
    // Botão WhatsApp fixo no canto inferior direito
    const botaoWpp = page.locator('a[href*="wa.me"]').first()
    await expect(botaoWpp).toBeVisible()
  })

  test('rodapé exibe nome da padaria', async ({ page }) => {
    await page.goto('/')
    const rodape = page.locator('footer')
    await expect(rodape).toContainText(/Felipe/i)
  })
})
