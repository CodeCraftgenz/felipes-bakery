/**
 * Schemas de Validação de Pedidos — Felipe's Bakery
 *
 * Schemas Zod usados tanto no frontend (validação de formulário)
 * quanto no backend (validação da requisição da API).
 *
 * Podem ser importados em qualquer ambiente (server e client).
 */

import { z } from 'zod'

// ── Schema de Item do Pedido ──────────────────────────────────
export const schemaItemPedido = z.object({
  produtoId:  z.number().int().positive('ID do produto inválido'),
  quantidade: z.number().int().min(1, 'Quantidade mínima é 1').max(50, 'Quantidade máxima é 50'),
  preco:      z.number().positive('Preço inválido'),
})

// ── Schema do Endereço de Entrega ─────────────────────────────
export const schemaEndereco = z.object({
  cep:         z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos (somente números)'),
  logradouro:  z.string().min(3, 'Logradouro obrigatório').max(200),
  numero:      z.string().min(1, 'Número obrigatório').max(20),
  complemento: z.string().max(100).optional(),
  bairro:      z.string().min(2, 'Bairro obrigatório').max(100),
  cidade:      z.string().min(2, 'Cidade obrigatória').max(100),
  estado:      z.string().length(2, 'Use a sigla do estado (ex: SP)'),
})

// ── Schema de Dados do Pagador ────────────────────────────────
export const schemaDadosPagador = z.object({
  nome:  z.string().min(3, 'Nome completo obrigatório').max(200),
  email: z.string().email('E-mail inválido'),
  cpf:   z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos (somente números)')
    .refine(validarCPF, 'CPF inválido'),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
})

// ── Schema de Criação de Pedido (body da API) ─────────────────
export const schemaCriarPedido = z.object({
  itens:        z.array(schemaItemPedido).min(1, 'O carrinho está vazio'),
  endereco:     schemaEndereco,
  pagador:      schemaDadosPagador,
  codigoCupom:  z.string().max(20).optional(),
  observacoes:  z.string().max(500).optional(),
})

// ── Schema de Validação de Cupom ──────────────────────────────
export const schemaValidarCupom = z.object({
  codigo:   z.string().min(1).max(20).transform((s) => s.toUpperCase()),
  subtotal: z.number().positive(),
})

// ── Tipos inferidos ───────────────────────────────────────────
export type ItemPedidoInput    = z.infer<typeof schemaItemPedido>
export type EnderecoInput      = z.infer<typeof schemaEndereco>
export type DadosPagadorInput  = z.infer<typeof schemaDadosPagador>
export type CriarPedidoInput   = z.infer<typeof schemaCriarPedido>
export type ValidarCupomInput  = z.infer<typeof schemaValidarCupom>

// ── Funções auxiliares ────────────────────────────────────────

/**
 * Valida se um CPF é matematicamente correto (algoritmo oficial).
 * Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 */
function validarCPF(cpf: string): boolean {
  // Rejeita todos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Calcula o primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i)
  }
  let digito1 = 11 - (soma % 11)
  if (digito1 >= 10) digito1 = 0

  // Calcula o segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i)
  }
  let digito2 = 11 - (soma % 11)
  if (digito2 >= 10) digito2 = 0

  return parseInt(cpf[9]) === digito1 && parseInt(cpf[10]) === digito2
}

/**
 * Formata um CPF string de 11 dígitos para o padrão xxx.xxx.xxx-xx.
 */
export function formatarCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Remove formatação do CPF (pontos e traços).
 */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Remove formatação do CEP.
 */
export function limparCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}
