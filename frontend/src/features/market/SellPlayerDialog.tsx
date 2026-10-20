import { Info } from 'lucide-react'

import type { Sale, SquadPlayer } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { ResultList } from '../../components/ui/ResultList'
import { useSingleAction } from '../../hooks/useSingleAction'
import { formatDateTime, formatInteger, formatMoney } from '../../lib/format'
import { PenaltyBadge } from '../clubs/PenaltyBadge'
import { useIsStarter } from '../clubs/queries'
import { MarketValueAside, PlayerSummary } from '../players/PlayerSummary'
import { useSellPlayer } from './queries'

type SellPlayerDialogProps = {
  player: SquadPlayer
  clubName: string
  onClose: () => void
  onSold: (sale: Sale, wasStarter: boolean) => void
}

/** The contract as the club page shows it now; the sale itself is valued by the API. */
export function SellPlayerDialog({ player, clubName, onClose, onSold }: SellPlayerDialogProps) {
  const sellPlayer = useSellPlayer()
  const isStarter = useIsStarter(player)
  const { run, isPending, error } = useSingleAction()

  function confirm() {
    run(
      () => sellPlayer.mutateAsync(player.id),
      (sale) => onSold(sale, isStarter),
    )
  }

  return (
    <Dialog
      title={`Vender ${player.name}?`}
      description={`O jogador sai do elenco do ${clubName} e volta a ficar livre.`}
      onClose={() => !isPending && onClose()}
      footer={
        <DialogActions
          confirmLabel="Confirmar venda"
          pendingLabel="Vendendo…"
          isPending={isPending}
          error={error}
          onCancel={onClose}
          onConfirm={confirm}
        />
      }
    >
      <div className="grid gap-4">
        {isStarter && (
          <Alert tone="warning">
            <strong className="block font-medium">{player.name} é titular</strong>
            Ao vender, ele sai da escalação, e o {clubName} só volta a jogar partidas depois de
            escalar de novo os 5 titulares.
          </Alert>
        )}
        <PlayerSummary player={player} aside={<MarketValueAside value={player.market_value} />} />
        <ResultList
          items={[
            { label: 'Valor de compra', value: formatMoney(player.contract.purchase_value) },
            {
              label: 'Fim da fidelidade',
              value: formatDateTime(player.contract.loyalty_until),
            },
            { label: 'Dias restantes', value: formatInteger(player.contract.remaining_days) },
            {
              label: '% de multa se vender agora',
              value: <PenaltyBadge rate={player.contract.penalty_rate} />,
            },
          ]}
        />
        <p className="flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          <Info aria-hidden className="size-4 shrink-0" />A venda é pelo valor de mercado do
          momento. Multa (teto de 10,00), lucro, comissão e crédito são calculados pela API ao
          confirmar.
        </p>
      </div>
    </Dialog>
  )
}
