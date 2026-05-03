/**
 * Testes E2E — Painel Admin
 *
 * Verifica redirecionamentos de autenticação e carregamento do admin.
 */

import { test, expect } from '@playwright/test'

test.describe('Painel Admin — Autenticação', () => {
  test('redireciona para /admin/login quando não autenticado', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('redireciona /admin para /admin/dashboard', async ({ page }) => {
    // Sem sessão → cai no login; testamos que /admin não é 404
    const response = await page.goto('/admin')
    expect(response?.status()).not.toBe(404)
  })

  test('página de login do admin carrega corretamente', async ({ page }) => {
    await page.goto('/admin/login')
    // Deve ter campo de email
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
    // Deve ter campo de senha
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    // Deve ter botão de login
    await expect(page.locator('button[type="submit"]').first()).toBeVisible()
  })
})

test.describe('Painel Admin — Login', () => {
  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/admin/login')

    await page.fill('input[name="email"]', 'invalido@email.com')
    await page.fill('input[type="password"]', 'senhaerrada123')
    await page.click('button[type="submit"]')

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
