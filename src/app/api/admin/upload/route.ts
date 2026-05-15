/**
 * API Admin — Upload de Imagens
 * POST /api/admin/upload (multipart/form-data, campo "file")
 *
 * Salva o arquivo em /app/uploads/ (montado como volume Docker para
 * sobreviver a rebuilds do container) e retorna a URL pública do arquivo.
 *
 * Validações:
 *   - Apenas imagens (image/*)
 *   - Tamanho máximo 5MB
 *   - Nome gerado por timestamp + UUID para evitar colisões
 *
 * Resposta: { url: "/uploads/2026-05-12T19-30-00_a1b2c3d4.jpg" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir }          from 'node:fs/promises'
import path                          from 'node:path'
import crypto                        from 'node:crypto'
import { requireAdmin } from '@backend/lib/auth/require-admin'

export const runtime = 'nodejs'

const TAMANHO_MAX_BYTES = 5 * 1024 * 1024   // 5 MB
const EXTENSOES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const PASTA_UPLOADS = process.env.UPLOAD_DIR || '/app/uploads'

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ erro: 'Arquivo ausente (campo "file")' }, { status: 400 })
  }

  // Valida tipo
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ erro: 'O arquivo deve ser uma imagem' }, { status: 400 })
  }

  // Valida tamanho
  if (file.size > TAMANHO_MAX_BYTES) {
    return NextResponse.json({ erro: 'Imagem deve ter no máximo 5MB' }, { status: 400 })
  }

  // Valida extensão (defesa em profundidade)
  const extOriginal = path.extname(file.name).toLowerCase()
  if (!EXTENSOES_PERMITIDAS.includes(extOriginal)) {
    return NextResponse.json(
      { erro: `Extensão não permitida. Use: ${EXTENSOES_PERMITIDAS.join(', ')}` },
      { status: 400 },
    )
  }

  // Gera nome único: timestamp + 8 chars aleatórios
  const ts        = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const aleatorio = crypto.randomBytes(4).toString('hex')
  const nomeFinal = `${ts}_${aleatorio}${extOriginal}`

  try {
    await mkdir(PASTA_UPLOADS, { recursive: true })
    const caminho = path.join(PASTA_UPLOADS, nomeFinal)
    const buffer  = Buffer.from(await file.arrayBuffer())
    await writeFile(caminho, buffer)

    return NextResponse.json({ url: `/uploads/${nomeFinal}` }, { status: 201 })
  } catch (err) {
    console.error('[upload] Erro ao salvar arquivo:', err)
    return NextResponse.json({ erro: 'Erro ao salvar arquivo' }, { status: 500 })
  }
}
