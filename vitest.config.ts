/**
 * Configuração do Vitest — Felipe's Bakery
 *
 * Aliases mapeados para refletir exatamente o tsconfig.json.
 * Coverage com limiares mínimos de 70% em linhas/funções.
 */

import { defineConfig } from 'vitest/config'
import { resolve }      from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals:     true,
    setupFiles:  ['./tests/setup.ts'],
    // Inclui apenas testes unitários — e2e do Playwright vão em ./tests/e2e
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'tests/e2e/**',
      '**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/e2e/',
        'drizzle/',
        'banco/migrations/',
        'infra/',
        '**/*.config.*',
      ],
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      // Igual ao tsconfig.json
      '@':              resolve(__dirname, './src'),
      '@backend':       resolve(__dirname, './src/backend'),
      '@frontend':      resolve(__dirname, './src/frontend'),
      '@compartilhado': resolve(__dirname, './src/compartilhado'),
      '@banco':         resolve(__dirname, './banco'),
      '@schema':        resolve(__dirname, './banco/schema/index.ts'),
      '@env':           resolve(__dirname, './src/compartilhado/env.ts'),
    },
  },
})
