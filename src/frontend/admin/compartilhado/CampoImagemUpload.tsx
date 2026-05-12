/**
 * CampoImagemUpload — Felipe's Bakery Admin
 *
 * Campo combinado de URL + upload de arquivo:
 *   - Aceita uma URL externa (Pexels, Unsplash, etc.) digitada/colada
 *   - Aceita upload de arquivo do computador/celular (até 5MB)
 *
 * Em ambos os casos, o resultado final é uma string URL que é exibida
 * em preview e pode ser persistida pelo formulário pai.
 *
 * Uso (componente controlado):
 *   <CampoImagemUpload value={url} onChange={setUrl} />
 */

'use client'

import { useRef, useState } from 'react'
import { toast }            from 'sonner'
import {
  Loader2, Upload, X as IconX, Image as ImageIcon, Link2,
} from 'lucide-react'
import { Botao, Entrada } from '@frontend/compartilhado/ui'

interface Props {
  value:    string
  onChange: (url: string) => void
  id?:      string
  label?:   string
}

export function CampoImagemUpload({ value, onChange, id, label }: Props) {
  const inputArquivo = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (!arquivo.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPG, PNG, WebP, GIF)')
      return
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    setCarregando(true)
    try {
      const formData = new FormData()
      formData.append('file', arquivo)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body:   formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.erro ?? 'Erro ao enviar imagem')
        return
      }
      const json = await res.json()
      onChange(json.url)
      toast.success('Imagem enviada!')
    } catch {
      toast.error('Falha de conexão ao enviar')
    } finally {
      setCarregando(false)
      // Limpa o input pra permitir re-selecionar o mesmo arquivo
      if (inputArquivo.current) inputArquivo.current.value = ''
    }
  }

  function limpar() {
    onChange('')
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}

      {/* Preview se já tem imagem */}
      {value && (
        <div className="relative inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pré-visualização"
            className="h-32 w-32 rounded-md border border-stone-200 object-cover"
          />
          <button
            type="button"
            onClick={limpar}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
            aria-label="Remover imagem"
          >
            <IconX className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* URL externa */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Entrada
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https:// ou envie do seu dispositivo →"
            className="pl-9"
            disabled={carregando}
          />
        </div>
        <Botao
          type="button"
          variante="contorno"
          onClick={() => inputArquivo.current?.click()}
          disabled={carregando}
          className="shrink-0"
        >
          {carregando
            ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            : <Upload className="mr-1.5 h-4 w-4" />}
          Enviar arquivo
        </Botao>
      </div>

      <input
        ref={inputArquivo}
        type="file"
        accept="image/*"
        onChange={aoSelecionarArquivo}
        className="hidden"
        aria-label="Selecionar arquivo de imagem"
      />

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <ImageIcon className="h-3 w-3" />
        Cole uma URL pública ou envie uma foto (JPG/PNG/WebP, até 5MB).
      </p>
    </div>
  )
}
