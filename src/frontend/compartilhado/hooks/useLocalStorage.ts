/**
 * Hook useLocalStorage — Felipe's Bakery
 *
 * Sincroniza um estado React com o localStorage.
 * Funciona de forma segura com SSR (Next.js) — não acessa window no servidor.
 *
 * @param chave   - Chave no localStorage
 * @param inicial - Valor inicial se a chave não existir
 *
 * @example
 * const [tema, setTema] = useLocalStorage('tema-admin', 'claro')
 */

'use client'

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(chave: string, inicial: T) {
  // Inicializa com o valor do localStorage ou com o valor inicial
  const [valor, setValor] = useState<T>(() => {
    // No servidor (SSR), retorna o valor inicial
    if (typeof window === 'undefined') return inicial

    try {
      const item = window.localStorage.getItem(chave)
      return item ? (JSON.parse(item) as T) : inicial
    } catch {
      return inicial
    }
  })

  // Sincroniza com o localStorage quando o valor muda
  useEffect(() => {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      // Silencia erros de localStorage cheio ou modo privado
    }
  }, [chave, valor])

  return [valor, setValor] as const
}
