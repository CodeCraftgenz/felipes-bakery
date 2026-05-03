/**
 * Serviço de E-mail — Felipe's Bakery
 *
 * Centraliza o envio de e-mails transacionais usando o Resend.
 * Fornece funções de alto nível para cada tipo de e-mail do sistema,
 * com templates HTML inline compatíveis com os principais clientes de e-mail.
 *
 * Variáveis de ambiente necessárias:
 *   RESEND_API_KEY      — chave de API do Resend (obrigatória)
 *   EMAIL_REMETENTE     — endereço do remetente (padrão: contato@felipesbakery.com.br)
 *
 * Uso:
 *   import { enviarEmailPedidoConfirmado } from '@backend/lib/email'
 *
 *   await enviarEmailPedidoConfirmado({
 *     para:         'cliente@email.com',
 *     nome:         'Maria',
 *     numeroPedido: 'PED-001234',
 *     itens:        [{ nome: 'Pão Artesanal', quantidade: 2, precoUnitario: 12.50 }],
 *     total:        25.00,
 *     dataEntrega:  '15/04/2026',
 *   })
 *
 * NUNCA importar em Client Components.
 */

import 'server-only'

import { Resend }       from 'resend'
import { criarLogger }  from './logger'

// Logger específico para o módulo de e-mail
const log = criarLogger('email')

// ── Inicialização do cliente Resend ───────────────────────
const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  log.warn(
    'RESEND_API_KEY não está definida — e-mails não serão enviados em produção.\n' +
    'Configure a variável no arquivo .env.local'
  )
}

// Instância singleton do cliente Resend
const resend = new Resend(apiKey ?? 'placeholder-key-para-dev')

/** Endereço do remetente de todos os e-mails transacionais */
const REMETENTE = process.env.EMAIL_REMETENTE ?? 'Felipe\'s Bakery <contato@felipesbakery.com.br>'

// ── Tipos de dados dos templates ──────────────────────────

/** Item de pedido para exibição no e-mail */
type ItemPedido = {
  nome:          string
  quantidade:    number
  precoUnitario: number
}

/** Dados para o e-mail de confirmação de pedido */
type DadosPedidoConfirmado = {
  para:         string
  nome:         string
  numeroPedido: string
  itens:        ItemPedido[]
  total:        number
  dataEntrega:  string
}

/** Dados para o e-mail de boas-vindas */
type DadosBoasVindas = {
  para:  string
  nome:  string
}

// ── Estilos base (reutilizados nos templates) ─────────────
// Definidos como constantes para manter os templates limpos e consistentes

/** Paleta de cores da Felipe's Bakery */
const CORES = {
  marrom:       '#5C3317',   // marrom artesanal — cor principal
  marromClaro:  '#8B5A2B',   // marrom médio — botões e destaques
  dourado:      '#C8973A',   // dourado — acentos e bordas
  creme:        '#FDF6EC',   // creme — fundo dos e-mails
  branco:       '#FFFFFF',
  cinzaTexto:   '#4A4A4A',   // texto principal
  cinzaClaro:   '#888888',   // texto secundário
  verdeOk:      '#2E7D32',   // status positivo
}

/** CSS inline base para o container do e-mail */
const estiloBase = `
  font-family: Georgia, 'Times New Roman', serif;
  background-color: ${CORES.creme};
  color: ${CORES.cinzaTexto};
  margin: 0;
  padding: 0;
`

// ── Templates HTML ────────────────────────────────────────

/**
 * Gera o cabeçalho padrão dos e-mails com o logo textual da padaria.
 */
function gerarCabecalho(): string {
  return `
    <div style="background-color: ${CORES.marrom}; padding: 32px 40px; text-align: center;">
      <h1 style="
        margin: 0;
        font-family: Georgia, serif;
        font-size: 28px;
        font-weight: bold;
        color: ${CORES.dourado};
        letter-spacing: 2px;
        text-transform: uppercase;
      ">Felipe's Bakery</h1>
      <p style="
        margin: 6px 0 0;
        font-size: 13px;
        color: ${CORES.creme};
        letter-spacing: 1px;
        font-style: italic;
      ">Pão artesanal feito com amor</p>
    </div>
  `
}

/**
 * Gera o rodapé padrão dos e-mails com informações de contato.
 */
function gerarRodape(): string {
  return `
    <div style="
      background-color: ${CORES.marrom};
      padding: 24px 40px;
      text-align: center;
    ">
      <p style="margin: 0 0 8px; font-size: 13px; color: ${CORES.creme};">
        Dúvidas? Fale conosco pelo WhatsApp ou responda este e-mail.
      </p>
      <p style="margin: 0; font-size: 12px; color: ${CORES.dourado};">
        © ${new Date().getFullYear()} Felipe's Bakery — Todos os direitos reservados
      </p>
    </div>
  `
}

/**
 * Envolve o conteúdo em um layout de e-mail responsivo.
 */
function envolverLayout(conteudo: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Felipe's Bakery</title>
    </head>
    <body style="${estiloBase}">
      <table role="presentation" cellpadding="0" cellspacing="0"
             style="width: 100%; background-color: ${CORES.creme};">
        <tr>
          <td align="center" style="padding: 24px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0"
                   style="width: 100%; max-width: 580px; background-color: ${CORES.branco};
                          border-radius: 8px; overflow: hidden;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <tr><td>${gerarCabecalho()}</td></tr>
              <tr><td style="padding: 32px 40px;">${conteudo}</td></tr>
              <tr><td>${gerarRodape()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Gera o template HTML de confirmação de pedido.
 */
function templatePedidoConfirmado(dados: DadosPedidoConfirmado): string {
  // Formata os itens do pedido como linhas de tabela
  const linhasItens = dados.itens
    .map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #F0E8D8; font-size: 15px;">
          ${item.nome}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #F0E8D8; text-align: center;
                   color: ${CORES.cinzaClaro}; font-size: 14px;">
          ${item.quantidade}x
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #F0E8D8; text-align: right;
                   font-size: 15px; color: ${CORES.marromClaro};">
          R$ ${(item.precoUnitario * item.quantidade).toFixed(2).replace('.', ',')}
        </td>
      </tr>
    `)
    .join('')

  const totalFormatado = dados.total.toFixed(2).replace('.', ',')

  return envolverLayout(`
    <!-- Saudação -->
    <h2 style="margin: 0 0 8px; font-size: 22px; color: ${CORES.marrom};">
      Pedido confirmado! 🎉
    </h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${CORES.cinzaTexto};">
      Olá, <strong>${dados.nome}</strong>! Recebemos seu pedido com sucesso.
    </p>

    <!-- Número do pedido -->
    <div style="
      background-color: ${CORES.creme};
      border-left: 4px solid ${CORES.dourado};
      padding: 16px 20px;
      margin-bottom: 28px;
      border-radius: 0 4px 4px 0;
    ">
      <p style="margin: 0; font-size: 13px; color: ${CORES.cinzaClaro}; text-transform: uppercase;
                letter-spacing: 1px;">Número do pedido</p>
      <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: ${CORES.marrom};
                letter-spacing: 2px;">${dados.numeroPedido}</p>
    </div>

    <!-- Tabela de itens -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
      <thead>
        <tr>
          <th style="text-align: left; padding-bottom: 10px; font-size: 13px;
                     color: ${CORES.cinzaClaro}; text-transform: uppercase;
                     letter-spacing: 1px; border-bottom: 2px solid ${CORES.dourado};">
            Produto
          </th>
          <th style="text-align: center; padding-bottom: 10px; font-size: 13px;
                     color: ${CORES.cinzaClaro}; text-transform: uppercase;
                     letter-spacing: 1px; border-bottom: 2px solid ${CORES.dourado};">
            Qtd.
          </th>
          <th style="text-align: right; padding-bottom: 10px; font-size: 13px;
                     color: ${CORES.cinzaClaro}; text-transform: uppercase;
                     letter-spacing: 1px; border-bottom: 2px solid ${CORES.dourado};">
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody>${linhasItens}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top: 14px; font-size: 16px; font-weight: bold;
                                  color: ${CORES.marrom};">
            Total
          </td>
          <td style="padding-top: 14px; text-align: right; font-size: 20px;
                     font-weight: bold; color: ${CORES.marrom};">
            R$ ${totalFormatado}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Data de entrega -->
    <div style="
      background-color: #F0FAF0;
      border: 1px solid #C8E6C9;
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 28px;
    ">
      <p style="margin: 0; font-size: 14px; color: ${CORES.verdeOk};">
        <strong>Data prevista para retirada:</strong> ${dados.dataEntrega}
      </p>
    </div>

    <!-- Mensagem final -->
    <p style="margin: 0; font-size: 15px; color: ${CORES.cinzaTexto}; line-height: 1.6;">
      Você receberá uma notificação quando seu pedido estiver pronto para retirada.
      Se tiver alguma dúvida, é só entrar em contato pelo WhatsApp.
    </p>
    <p style="margin: 16px 0 0; font-size: 15px; color: ${CORES.cinzaTexto};">
      Com carinho,<br />
      <strong style="color: ${CORES.marrom};">Equipe Felipe's Bakery</strong>
    </p>
  `)
}

/**
 * Gera o template HTML de boas-vindas ao novo cliente.
 */
function templateBoasVindas(dados: DadosBoasVindas): string {
  return envolverLayout(`
    <!-- Saudação principal -->
    <h2 style="margin: 0 0 8px; font-size: 22px; color: ${CORES.marrom};">
      Bem-vindo(a) à família! 🍞
    </h2>
    <p style="margin: 0 0 24px; font-size: 16px; color: ${CORES.cinzaTexto};">
      Olá, <strong>${dados.nome}</strong>!
    </p>

    <!-- Conteúdo de boas-vindas -->
    <p style="margin: 0 0 20px; font-size: 15px; color: ${CORES.cinzaTexto}; line-height: 1.7;">
      Estamos muito felizes em ter você aqui na <strong>Felipe's Bakery</strong>.
      Agora você pode explorar nosso catálogo de pães artesanais, bolos e doces
      preparados com ingredientes selecionados e receitas tradicionais.
    </p>

    <!-- Destaques da padaria -->
    <div style="
      background-color: ${CORES.creme};
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 28px;
    ">
      <p style="margin: 0 0 16px; font-size: 14px; font-weight: bold;
                color: ${CORES.marrom}; text-transform: uppercase;
                letter-spacing: 1px;">
        Por que escolher a gente?
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
        ${[
          ['🌾', 'Ingredientes naturais', 'Farinha artesanal e fermento natural'],
          ['👨‍🍳', 'Feito na hora', 'Pão saindo do forno todo dia cedo'],
          ['🚀', 'Pedido fácil', 'Monte seu pedido e retire sem fila'],
        ].map(([emoji, titulo, desc]) => `
          <tr>
            <td style="padding: 8px 0; width: 40px; vertical-align: top; font-size: 22px;">${emoji}</td>
            <td style="padding: 8px 0; vertical-align: top;">
              <strong style="font-size: 14px; color: ${CORES.marrom};">${titulo}</strong><br />
              <span style="font-size: 13px; color: ${CORES.cinzaClaro};">${desc}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${process.env.NEXT_PUBLIC_URL ?? 'https://felipesbakery.com.br'}/catalogo"
         style="
           display: inline-block;
           background-color: ${CORES.marrom};
           color: ${CORES.creme};
           text-decoration: none;
           padding: 14px 36px;
           border-radius: 6px;
           font-size: 15px;
           font-weight: bold;
           letter-spacing: 1px;
         ">
        Ver cardápio completo
      </a>
    </div>

    <!-- Assinatura -->
    <p style="margin: 0; font-size: 15px; color: ${CORES.cinzaTexto}; line-height: 1.6;">
      Qualquer dúvida, estamos disponíveis pelo WhatsApp ou por e-mail.
    </p>
    <p style="margin: 16px 0 0; font-size: 15px; color: ${CORES.cinzaTexto};">
      Com carinho,<br />
      <strong style="color: ${CORES.marrom};">Felipe e toda a equipe da padaria</strong>
    </p>
  `)
}

// ── Funções de envio ──────────────────────────────────────

/**
 * Função de baixo nível para envio de e-mail via Resend.
 * Use as funções de alto nível (enviarEmailPedidoConfirmado, etc.) sempre que possível.
 *
 * @param para     - Endereço de e-mail do destinatário
 * @param assunto  - Assunto do e-mail
 * @param html     - Corpo do e-mail em HTML
 *
 * @throws Error se o envio falhar após tentativa
 */
export async function enviarEmail(
  para:    string,
  assunto: string,
  html:    string
): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from:    REMETENTE,
      to:      para,
      subject: assunto,
      html,
    })

    if (error) {
      log.error({ error, para, assunto }, 'Resend retornou erro ao enviar e-mail')
      throw new Error(`[Email] Falha no envio: ${error.message}`)
    }

    log.info({ emailId: data?.id, para, assunto }, 'E-mail enviado com sucesso')
  } catch (err) {
    // Re-lança para que o worker possa registrar a falha e tentar novamente
    log.error({ err, para, assunto }, 'Exceção ao enviar e-mail')
    throw err
  }
}

/**
 * Envia o e-mail de confirmação de pedido ao cliente.
 *
 * @param dados - Informações do pedido para montar o e-mail
 */
export async function enviarEmailPedidoConfirmado(
  dados: DadosPedidoConfirmado
): Promise<void> {
  const assunto = `Pedido ${dados.numeroPedido} confirmado — Felipe's Bakery`
  const html    = templatePedidoConfirmado(dados)

  log.info(
    { para: dados.para, numeroPedido: dados.numeroPedido },
    'Enviando e-mail de confirmação de pedido'
  )

  await enviarEmail(dados.para, assunto, html)
}

/**
 * Envia o e-mail de boas-vindas ao novo cliente cadastrado.
 *
 * @param dados - Nome e endereço de e-mail do novo cliente
 */
export async function enviarEmailBoasVindas(
  dados: DadosBoasVindas
): Promise<void> {
  const assunto = `Bem-vindo(a) à Felipe's Bakery, ${dados.nome}!`
  const html    = templateBoasVindas(dados)

  log.info({ para: dados.para }, 'Enviando e-mail de boas-vindas')

  await enviarEmail(dados.para, assunto, html)
}
