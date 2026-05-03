import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge de classes Tailwind com suporte a condicionais (shadcn/ui pattern) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata valor monetário em Real brasileiro */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(num)
}

/** Gera número de pedido no formato FBK-YYYYMMDD-XXXX */
export function generateOrderNumber(): string {
  const date = new Date()
  const y    = date.getFullYear()
  const m    = String(date.getMonth() + 1).padStart(2, '0')
  const d    = String(date.getDate()).padStart(2, '0')
  const seq  = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `FBK-${y}${m}${d}-${seq}`
}

/** Calcula a próxima data de entrega baseada no ciclo da loja */
export function getNextDeliveryDate(
  cutoffDay: number,
  deliveryDay: number,
  cutoffHour: number,
): Date {
  const now  = new Date()
  const day  = now.getDay()  // 0=Dom ... 6=Sáb
  const hour = now.getHours()

  // Se hoje é o dia de corte e ainda não passou do horário, entrega é nessa sexta
  // Caso contrário, entrega é na próxima sexta
  const daysUntilDelivery = (deliveryDay - day + 7) % 7
  const isPastCutoff = day === cutoffDay && hour >= cutoffHour

  const delivery = new Date(now)
  delivery.setDate(
    now.getDate() + (daysUntilDelivery === 0 || isPastCutoff
      ? 7
      : daysUntilDelivery),
  )
  delivery.setHours(0, 0, 0, 0)
  return delivery
}

/** Verifica se ainda está dentro do período de aceite de pedidos */
export function isWithinOrderCutoff(cutoffDay: number, cutoffHour: number): boolean {
  const now  = new Date()
  const day  = now.getDay()
  const hour = now.getHours()

  // Aceita pedidos se estamos antes do dia de corte (na semana atual)
  // ou se estamos no dia de corte mas antes do horário
  const daysUntilCutoff = (cutoffDay - day + 7) % 7
  if (daysUntilCutoff > 0) return true
  if (daysUntilCutoff === 0 && hour < cutoffHour) return true
  return false
}

/** Slugify em português */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Trunca texto em N caracteres */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + '…'
}
