/**
 * Setup Global de Testes — Felipe's Bakery
 *
 * Configurações globais do Vitest: mocks, matchers do jest-dom e
 * variáveis de ambiente mínimas para o ambiente de testes.
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Mock de localStorage para o Zustand persist ────────────────
// jsdom provê localStorage mas certos middlewares acessam antes da
// inicialização completa do DOM. Fornecer um mock determinístico
// evita "storage.setItem is not a function" em ambiente de testes.
const armazenamento = new Map<string, string>()
const localStorageMock: Storage = {
  get length() { return armazenamento.size },
  clear:        () => armazenamento.clear(),
  getItem:      (chave) => armazenamento.get(chave) ?? null,
  setItem:      (chave, valor) => { armazenamento.set(chave, String(valor)) },
  removeItem:   (chave) => { armazenamento.delete(chave) },
  key:          (indice) => Array.from(armazenamento.keys())[indice] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', {
  value:    localStorageMock,
  writable: true,
})

// ── Variáveis de ambiente mínimas para testes ─────────────────
process.env.DATABASE_URL    = 'mysql://test:test@localhost:3306/test'
process.env.NEXTAUTH_SECRET = 'test-secret-32-chars-minimum-ok!'
process.env.NEXTAUTH_URL    = 'http://localhost:3000'
// NODE_ENV é read-only no tipo NodeJS.ProcessEnv — usamos atribuição
// indireta para evitar TS2540, mantendo o efeito em runtime.
;(process.env as Record<string, string>).NODE_ENV = 'test'

// ── Mock do guard server-only ─────────────────────────────────
vi.mock('server-only', () => ({}))

// ── Mock do next/navigation ───────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter:       vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })),
  usePathname:     vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect:        vi.fn(),
  notFound:        vi.fn(),
}))

// ── Mock do next-auth ─────────────────────────────────────────
vi.mock('next-auth', () => ({
  default:          vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession:      vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn:          vi.fn(),
  signOut:         vi.fn(),
}))

// ── Mock do banco de dados ────────────────────────────────────
vi.mock('@/lib/db', () => ({
  db: {
    select:  vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    insert:  vi.fn(() => ({ values: vi.fn(() => [{}]) })),
    update:  vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete:  vi.fn(() => ({ where: vi.fn() })),
  },
}))
