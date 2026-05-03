/**
 * CrachaBadgeStatus — Felipe's Bakery Admin
 *
 * Badge colorido para exibir o status de um pedido.
 * Reutilizado em tabelas, modais e detalhe de pedido.
 */

import { Cracha } from '@frontend/compartilhado/ui'
import type { ComponentProps } from 'react'

type VarianteCracha = ComponentProps<typeof Cracha>['variante']

// Mapeamento status → variante visual + rótulo em PT
const CONFIG_STATUS: Record<string, { variante: VarianteCracha; rotulo: string }> = {
  aguardando_pagamento: { variante: 'alerta',    rotulo: 'Aguardando Pix'  },
  confirmado:           { variante: 'sucesso',   rotulo: 'Confirmado'      },
  em_producao:          { variante: 'padrao',    rotulo: 'Em Produção'     },
  pronto:               { variante: 'secundario', rotulo: 'Pronto'         },
  entregue:             { variante: 'contorno',  rotulo: 'Entregue'        },
  cancelado:            { variante: 'perigo',    rotulo: 'Cancelado'       },
}

interface CrachaBadgeStatusProps {
  status: string
}

export function CrachaBadgeStatus({ status }: CrachaBadgeStatusProps) {
  const config = CONFIG_STATUS[status] ?? { variante: 'secundario' as VarianteCracha, rotulo: status }

  return (
    <Cracha variante={config.variante} className="text-xs">
      {config.rotulo}
    </Cracha>
  )
}

/** Retorna o rótulo em português dado o status */
export function rotuloStatus(status: string): string {
  return CONFIG_STATUS[status]?.rotulo ?? status
}
