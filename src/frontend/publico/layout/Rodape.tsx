/**
 * Rodapé do Site Público — Felipe's Bakery
 *
 * Rodapé com informações da padaria, links úteis e contato.
 * Seções:
 *   - Coluna 1: Logo + descrição breve + redes sociais
 *   - Coluna 2: Links do cardápio (categorias)
 *   - Coluna 3: Links institucionais (sobre, contato, política)
 *   - Coluna 4: Informações de contato + ciclo de pedidos
 *   - Linha inferior: Copyright + link para política de privacidade
 */

import React    from 'react'
import Link     from 'next/link'
import { Instagram, Phone, Mail } from 'lucide-react'

// Ano atual para o copyright (Server Component — executado no servidor)
const anoAtual = new Date().getFullYear()

// ── Componente ────────────────────────────────────────────────
export function Rodape() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── Grade Principal ───────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">

          {/* Coluna 1: Marca */}
          <div className="space-y-4">
            <h2 className="font-playfair text-xl font-bold text-white">
              Felipe&apos;s Bakery
            </h2>
            <p className="text-sm leading-relaxed text-stone-400">
              Pães artesanais de fermentação natural.
              Feitos com carinho, ingredientes selecionados
              e respeito pelo processo.
            </p>

            {/* Redes sociais */}
            <div className="flex gap-3 pt-1">
              <a
                href="https://instagram.com/felipesbakery"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 text-stone-400 transition-colors hover:bg-brand-500 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/5516997684430"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 text-stone-400 transition-colors hover:bg-[#25D366] hover:text-white"
              >
                {/* Ícone WhatsApp mini */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Coluna 2: Cardápio */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Cardápio
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/catalogo?categoria=paes-rusticos',      rotulo: 'Pães Rústicos'      },
                { href: '/catalogo?categoria=semi-integral',      rotulo: 'Semi-Integral'      },
                { href: '/catalogo?categoria=folhado-artesanal',  rotulo: 'Folhado Artesanal'  },
                { href: '/catalogo',                              rotulo: 'Ver tudo'           },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-400 transition-colors hover:text-white"
                  >
                    {link.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Links Institucionais */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              A Padaria
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/sobre',              rotulo: 'Nossa História'       },
                { href: '/contato',            rotulo: 'Contato'              },
                { href: '/politica-privacidade', rotulo: 'Política de Privacidade' },
                { href: '/termos',             rotulo: 'Termos de Uso'        },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-400 transition-colors hover:text-white"
                  >
                    {link.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Contato e Ciclo de Pedidos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Contato
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://wa.me/5516997684430"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-stone-400 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  (16) 997 684 430
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@felipesbakery.com.br"
                  className="flex items-center gap-2 text-stone-400 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  contato@felipesbakery.com.br
                </a>
              </li>
            </ul>

            {/* Ciclo de pedidos */}
            <div className="rounded-lg bg-stone-800 p-3 text-sm">
              <p className="font-medium text-stone-300">Ciclo de Pedidos</p>
              <p className="mt-1 text-stone-400 text-xs leading-relaxed">
                Pedidos até <strong className="text-stone-300">Quarta 23h</strong><br />
                Entrega na <strong className="text-stone-300">Sexta-feira</strong>
              </p>
            </div>
          </div>

        </div>

        {/* ── Linha Inferior ────────────────────────────────── */}
        <div className="border-t border-stone-800 py-6 text-center text-xs text-stone-500">
          <p>
            &copy; {anoAtual} Felipe&apos;s Bakery. Todos os direitos reservados.
          </p>
        </div>

      </div>
    </footer>
  )
}
