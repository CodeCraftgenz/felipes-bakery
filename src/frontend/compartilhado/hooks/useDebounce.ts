/**
 * Hook useDebounce — Felipe's Bakery
 *
 * Atrasa a atualização de um valor pelo tempo especificado.
 * Útil para evitar requisições a cada tecla digitada (ex: busca no catálogo).
 *
 * @param valor - Valor a ser "debouncado"
 * @param atraso - Tempo em ms para aguardar (padrão: 400ms)
 * @returns Valor atualizado somente após o atraso sem mudanças
 *
 * @example
 * const [busca, setBusca] = useState('')
 * const buscaDebounced = useDebounce(busca, 400)
 *
 * // buscaDebounced só muda 400ms depois que o usuário parar de digitar
 * useEffect(() => {
 *   buscarProdutos(buscaDebounced)
 * }, [buscaDebounced])
 */

'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(valor: T, atraso = 400): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor)

  useEffect(() => {
    // Agenda a atualização após o atraso
    const timer = setTimeout(() => {
      setValorDebounced(valor)
    }, atraso)

    // Cancela o timer se o valor mudar antes do atraso
    return () => clearTimeout(timer)
  }, [valor, atraso])

  return valorDebounced
}
