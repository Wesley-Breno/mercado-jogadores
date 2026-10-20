import { History } from 'lucide-react'

import type { Sale } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { ResultList } from '../../components/ui/ResultList'
import { SignedMoney } from '../../components/ui/SignedMoney'
import { formatInteger, formatMoney } from '../../lib/format'

type SaleResultDialogProps = {
  sale: Sale
  clubName: string
  wasStarter: boolean
  onClose: () => void
  onShowHistory: () => void
}

function describe(sale: Sale, wasStarter: boolean): string {
  const left = `${sale.player_name} voltou a ficar livre${wasStarter ? ' e saiu da escalação' : ''}.`
  return sale.remaining_days === 0
    ? `${left} A fidelidade já tinha terminado, então não houve multa.`
    : left
}

/**
 * Every value is the one returned by POST /players/{id}/sell; the hints only explain
 * them (RN15 and RN16), nothing is calculated on screen.
 */
export function SaleResultDialog({
  sale,
  clubName,
  wasStarter,
  onClose,
  onShowHistory,
}: SaleResultDialogProps) {
  const profit = sale.profit ?? 0
  return (
    <Dialog
      success
      title="Venda concluída"
      description={describe(sale, wasStarter)}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onShowHistory}>
            <History aria-hidden />
            Ver histórico
          </Button>
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      <ResultList
        items={[
          { label: 'Valor de compra', value: formatMoney(sale.purchase_value) },
          {
            label: 'Valor de venda',
            hint: 'Valor de mercado no momento da venda',
            value: formatMoney(sale.value),
          },
          { label: 'Dias restantes', value: formatInteger(sale.remaining_days) },
          {
            label: 'Multa',
            hint:
              sale.penalty_rate > 0
                ? `${sale.penalty_rate}% do valor de venda, com teto de 10,00`
                : 'Fidelidade cumprida: sem multa',
            value: formatMoney(sale.penalty),
          },
          {
            label: 'Lucro',
            value: <SignedMoney value={profit} />,
          },
          {
            label: 'Comissão',
            hint:
              profit > 0 ? '10% do lucro até 10,00 + 20% do que passar' : 'Sem lucro: sem comissão',
            value: formatMoney(sale.fee),
          },
          {
            label: 'Crédito no caixa',
            hint: 'Valor de venda − multa − comissão',
            value: <SignedMoney value={sale.cash_change} />,
            highlight: true,
          },
          {
            label: 'Contrato',
            value: (
              <Badge tone={sale.contract_status === 'RESCINDIDO' ? 'warning' : 'neutral'} dot>
                {sale.contract_status}
              </Badge>
            ),
          },
          {
            label: `Novo caixa do ${clubName}`,
            value: formatMoney(sale.club_cash),
            highlight: true,
          },
        ]}
      />
    </Dialog>
  )
}
