/**
 * Utilitários Compartilhados — Felipe's Bakery
 *
 * Funções puras sem dependência de Node.js ou browser.
 * Podem ser importadas tanto no servidor quanto no cliente.
 *
 * IMPORTANTE: Não importar aqui nada de next/*, server-only, ou APIs do Node.
 * Este módulo deve funcionar em qualquer ambiente JavaScript.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge }               from 'tailwind-merge'

// ── Tailwind / Classes CSS ────────────────────────────────

/**
 * Combina classes do Tailwind CSS de forma inteligente.
 * Resolve conflitos (ex: p-4 + p-2 → usa p-2) e suporta condicionais.
 *
 * Padrão do shadcn/ui — usado em todos os componentes.
 *
 * @example
 * cn('p-4 text-white', isActive && 'bg-blue-500', 'p-2')
 * // Resultado: 'text-white bg-blue-500 p-2' (p-4 resolvido para p-2)
 */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas))
}

// ── Formatação Monetária ──────────────────────────────────

/**
 * Formata um valor numérico como moeda brasileira (R$).
 *
 * @param valor - Número ou string representando o valor
 * @returns String formatada (ex: "R$ 15,50")
 *
 * @example
 * formatarMoeda(15.5)  // "R$ 15,50"
 * formatarMoeda('30')  // "R$ 30,00"
 */
export function formatarMoeda(valor: number | string): string {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(numero)
}

// ── Número de Pedido ──────────────────────────────────────

/**
 * Gera um número de pedido único no formato FBK-YYYYMMDD-XXXX.
 * FBK = Felipe's Bakery
 *
 * @returns String no formato "FBK-20260412-0042"
 *
 * @example
 * gerarNumeroPedido() // "FBK-20260412-0042"
 */
export function gerarNumeroPedido(): string {
  const agora = new Date()
  const ano   = agora.getFullYear()
  const mes   = String(agora.getMonth() + 1).padStart(2, '0')
  const dia   = String(agora.getDate()).padStart(2, '0')
  const seq   = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `FBK-${ano}${mes}${dia}-${seq}`
}

// ── Ciclo de Pedidos ──────────────────────────────────────

/**
 * Calcula a próxima data de entrega com base no ciclo da loja.
 * Na Felipe's Bakery: pedidos até quarta 23h, entrega sexta.
 *
 * @param diaCorte     - Dia da semana de corte (0=Dom, 3=Qua, 5=Sex)
 * @param diaEntrega   - Dia da semana de entrega (ex: 5=Sexta)
 * @param horaCorte    - Hora de corte (0-23)
 * @returns Date representando a próxima data de entrega
 */
export function calcularProximaEntrega(
  diaCorte: number,
  diaEntrega: number,
  horaCorte: number,
): Date {
  const agora = new Date()
  const dia   = agora.getDay()
  const hora  = agora.getHours()

  // Calcula dias até a próxima entrega
  const diasAteEntrega = (diaEntrega - dia + 7) % 7

  // Se já passou do horário de corte nesta semana, pula para a próxima
  const passouCorte = dia === diaCorte && hora >= horaCorte
  const diasAte     = diasAteEntrega === 0 || passouCorte
    ? 7
    : diasAteEntrega

  const entrega = new Date(agora)
  entrega.setDate(agora.getDate() + diasAte)
  entrega.setHours(0, 0, 0, 0)
  return entrega
}

/**
 * Verifica se ainda é possível fazer pedidos para o próximo ciclo.
 *
 * @param diaCorte  - Dia da semana de corte (0-6)
 * @param horaCorte - Hora de corte (0-23)
 * @returns true se ainda está dentro do prazo de pedidos
 */
export function dentroDoPrazo(diaCorte: number, horaCorte: number): boolean {
  const agora = new Date()
  const dia   = agora.getDay()
  const hora  = agora.getHours()

  const diasAteCorte = (diaCorte - dia + 7) % 7
  if (diasAteCorte > 0) return true
  if (diasAteCorte === 0 && hora < horaCorte) return true
  return false
}

// ── Strings ───────────────────────────────────────────────

/**
 * Converte uma string para slug URL-friendly.
 * Remove acentos, caracteres especiais e espaços.
 *
 * @param texto - Texto para converter
 * @returns Slug em letras minúsculas com hífens
 *
 * @example
 * slugificar('Pão Italiano') // "pao-italiano"
 * slugificar('Ciabatta com Nozes') // "ciabatta-com-nozes"
 */
export function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')            // Espaços viram hífens
    .replace(/-+/g, '-')             // Múltiplos hífens viram um
}

/**
 * Trunca um texto no número máximo de caracteres, adicionando "…" no fim.
 *
 * @param texto    - Texto a truncar
 * @param maximo   - Número máximo de caracteres
 * @returns Texto truncado com "…" se necessário
 */
export function truncar(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto
  return texto.slice(0, maximo).trimEnd() + '…'
}

// ── Datas ─────────────────────────────────────────────────

/**
 * Formata uma data no padrão brasileiro "dd/mm/aaaa".
 *
 * @param data - Date object ou string de data
 * @returns String no formato "12/04/2026"
 */
export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

/**
 * Formata uma data com hora no padrão brasileiro.
 *
 * @param data - Date object ou string de data
 * @returns String no formato "12/04/2026 às 14:30"
 */
export function formatarDataHora(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return new Intl.DateTimeFormat('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(d).replace(',', ' às')
}
