/**
 * API: Criar Pedido — Felipe's Bakery
 * POST /api/pedidos
 *
 * Cria um novo pedido no banco e gera o QR code Pix via Mercado Pago.
 *
 * Fluxo:
 *   1. Valida o body com Zod
 *   2. Valida o cupom (se houver) e calcula descontos
 *   3. Cria o pedido no banco (transação)
 *   4. Cria o pagamento Pix no Mercado Pago
 *   5. Salva os dados do Pix no banco
 *   6. Retorna o número do pedido e os dados do QR code
 *
 * Body: CriarPedidoInput
 * Response 201: { numeroPedido, qrCodeBase64, qrCodeTexto, expiracaoEm, valorTotal }
 * Response 400: { mensagem }
 * Response 500: { mensagem }
 */

import { NextRequest, NextResponse } from 'next/server'
import { inArray }                   from 'drizzle-orm'
import { auth }                      from '@backend/lib/auth'
import { db }                        from '@backend/lib/banco'
import { produtos }                  from '@schema'
import { criarPedido, registrarPagamentoPix } from '@backend/modulos/pedidos/mutations'
import { validarCupom }              from '@backend/modulos/cupons/queries'
import { criarPagamentoPix }         from '@backend/lib/pagamento'
import { schemaCriarPedido }         from '@compartilhado/validacoes/pedido'

export async function POST(req: NextRequest) {
  try {
    // ── Valida o body ────────────────────────────────────────
    const body   = await req.json()
    const parsed = schemaCriarPedido.safeParse(body)

    if (!parsed.success) {
      const erros = parsed.error.errors.map((e) => e.message).join(', ')
      return NextResponse.json(
        { mensagem: `Dados inválidos: ${erros}` },
        { status: 400 },
      )
    }

    const dados = parsed.data

    // ── Valida preços contra o banco (nunca confiar no cliente) ──
    const produtoIds = dados.itens.map((i) => i.produtoId)
    const precosDB   = await db
      .select({ id: produtos.id, preco: produtos.preco, status: produtos.status })
      .from(produtos)
      .where(inArray(produtos.id, produtoIds))

    const mapaPrecos: Record<number, number> = {}
    for (const p of precosDB) {
      if (p.status !== 'published') {
        return NextResponse.json(
          { mensagem: `Produto #${p.id} não está disponível para compra.` },
          { status: 400 },
        )
      }
      mapaPrecos[p.id] = Number(p.preco)
    }

    // Verifica se todos os produtos existem
    for (const item of dados.itens) {
      if (mapaPrecos[item.produtoId] === undefined) {
        return NextResponse.json(
          { mensagem: `Produto #${item.produtoId} não encontrado.` },
          { status: 400 },
        )
      }
    }

    // Substitui preços enviados pelo cliente com os preços reais do banco
    const itensComPrecoReal = dados.itens.map((item) => ({
      ...item,
      preco: mapaPrecos[item.produtoId],
    }))

    // ── Obtém ID do cliente autenticado (se logado) ──────────
    const sessao    = await auth()
    const clienteId = sessao?.user?.role === 'customer'
      ? parseInt(sessao.user.id ?? '0') || null
      : null

    // ── Valida cupom e calcula desconto ───────────────────────
    let valorDesconto = 0
    let cupomId:     number | null = null

    if (dados.codigoCupom) {
      const subtotal = itensComPrecoReal.reduce((s, i) => s + i.preco * i.quantidade, 0)
      const resultadoCupom = await validarCupom(
        dados.codigoCupom,
        subtotal,
        clienteId ?? undefined,
      )

      if (!resultadoCupom.valido) {
        return NextResponse.json(
          { mensagem: `Cupom inválido: ${resultadoCupom.motivo}` },
          { status: 400 },
        )
      }

      valorDesconto = resultadoCupom.cupom.valorDesconto
      cupomId       = resultadoCupom.cupom.id
    }

    // ── Calcula o total ───────────────────────────────────────
    const subtotalItens = itensComPrecoReal.reduce((s, i) => s + i.preco * i.quantidade, 0)
    const valorTotal    = Math.max(0, subtotalItens - valorDesconto)

    // ── Cria o pedido no banco ────────────────────────────────
    const pedido = await criarPedido({
      ...dados,
      itens: itensComPrecoReal,
      clienteId,
      valorDesconto,
      valorTotal,
      cupomId,
    })

    // ── Cria o pagamento Pix no Mercado Pago ──────────────────
    const pix = await criarPagamentoPix({
      pedidoId:     pedido.id,
      numeroPedido: pedido.numeroPedido,
      valor:        valorTotal,
      emailPagador: dados.pagador.email,
      nomePagador:  dados.pagador.nome,
      cpfPagador:   dados.pagador.cpf,
    })

    // ── Salva os dados do Pix no banco ────────────────────────
    await registrarPagamentoPix({
      pedidoId:      pedido.id,
      pagamentoMpId: pix.pagamentoMpId,
      valor:         valorTotal,
      qrCodeBase64:  pix.qrCodeBase64,
      qrCodeTexto:   pix.qrCodeTexto,
      expiracaoEm:   pix.expiracaoEm,
    })

    // ── Retorna para o frontend ───────────────────────────────
    return NextResponse.json(
      {
        numeroPedido:  pedido.numeroPedido,
        valorTotal:    pedido.valorTotal,
        qrCodeBase64:  pix.qrCodeBase64,
        qrCodeTexto:   pix.qrCodeTexto,
        expiracaoEm:   pix.expiracaoEm.toISOString(),
      },
      { status: 201 },
    )
  } catch (erro) {
    console.error('[API /pedidos] Erro ao criar pedido:', erro)
    return NextResponse.json(
      { mensagem: 'Não foi possível processar seu pedido. Tente novamente.' },
      { status: 500 },
    )
  }
}
