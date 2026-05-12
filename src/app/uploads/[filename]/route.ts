/**
 * Rota dinâmica para servir imagens enviadas pelo admin.
 *
 * Lê o arquivo de /app/uploads/ (volume Docker persistente) e devolve com
 * o Content-Type correto + cache de 1 ano (imagens têm nome único, não mudam).
 *
 * Por que rota dinâmica em vez de /public/uploads?
 *   - Next.js standalone só copia /public no build, não captura uploads
 *     feitos em runtime.
 *   - Esta rota torna o diretório /app/uploads (montado como volume)
 *     acessível publicamente sob /uploads/*.
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile }                  from 'node:fs/promises'
import path                          from 'node:path'

export const runtime  = 'nodejs'
// Não cachear a rota — o cache é do navegador via Cache-Control no header
export const dynamic  = 'force-dynamic'

const PASTA_UPLOADS = process.env.UPLOAD_DIR || '/app/uploads'

// Map extensão → MIME type
const TIPOS_MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } },
) {
  const nome = params.filename

  // Bloqueia path traversal (../, /, \)
  if (nome.includes('..') || nome.includes('/') || nome.includes('\\')) {
    return new NextResponse('Nome de arquivo inválido', { status: 400 })
  }

  const ext = path.extname(nome).toLowerCase()
  const tipo = TIPOS_MIME[ext]
  if (!tipo) {
    return new NextResponse('Extensão não suportada', { status: 400 })
  }

  try {
    const caminho = path.join(PASTA_UPLOADS, nome)
    const buffer  = await readFile(caminho)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':  tipo,
        // Imagens têm nomes únicos — cache agressivo (1 ano)
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Imagem não encontrada', { status: 404 })
  }
}
