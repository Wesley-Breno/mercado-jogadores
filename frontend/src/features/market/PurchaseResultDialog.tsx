import { ArrowRight } from 'lucide-react'

import type { Purchase } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Dialog } from '../../components/ui/Dialog'
import { ResultList } from '../../components/ui/ResultList'
import { formatDateTime, formatMoney } from '../../lib/format'

type PurchaseResultDialogProps = {
  purchase: Purchase
  clubName: string
  onClose: () => void
}

/**
 * Every value comes from the API response; the only sum on screen is the total cost
 * (value + fee), which the statement allows.
 */
export function PurchaseResultDialog({ purchase, clubName, onClose }: PurchaseResultDialogProps) {
  return (
    <Dialog
      success
      title="Compra concluída"
      description={`${purchase.player_name} agora é do ${clubName}.`}
      onClose={onClose}
      footer={
        <>
          <ButtonLink to={`/clubes/${purchase.club_id}`}>
            Ver clube
            <ArrowRight aria-hidden />
          </ButtonLink>
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      <ResultList
        items={[
          {
            label: 'Valor',
            hint: 'Valor de mercado no momento da compra',
            value: formatMoney(purchase.value),
          },
          {
            label: 'Taxa',
            hint:
              purchase.fee > 0
                ? '5% do valor, porque passa de 30,00'
                : 'Sem taxa, porque o valor não passa de 30,00',
            value: formatMoney(purchase.fee),
          },
          {
            label: 'Custo total',
            hint: 'Valor + taxa',
            value: formatMoney(purchase.value + purchase.fee),
            highlight: true,
          },
          {
            label: 'Fim da fidelidade',
            value: formatDateTime(purchase.contract.loyalty_until),
          },
          {
            label: 'Contrato',
            value: (
              <Badge tone="success" dot>
                {purchase.contract.status}
              </Badge>
            ),
          },
          {
            label: `Novo caixa do ${clubName}`,
            value: formatMoney(purchase.club_cash),
            highlight: true,
          },
        ]}
      />
    </Dialog>
  )
}
