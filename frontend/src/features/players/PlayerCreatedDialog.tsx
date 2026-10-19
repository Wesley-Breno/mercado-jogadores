import { Eye } from 'lucide-react'

import type { Player } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { ResultList } from '../../components/ui/ResultList'
import { formatMoney } from '../../lib/format'
import { CONDITION_LABELS, POSITION_LABELS } from './labels'

type PlayerCreatedDialogProps = {
  player: Player
  onClose: () => void
  onShowDetails: () => void
}

/** J07: the values come from the API response, as they were calculated when saving. */
export function PlayerCreatedDialog({ player, onClose, onShowDetails }: PlayerCreatedDialogProps) {
  const situation = player.club_id === null ? 'livre' : 'com clube'
  return (
    <Dialog
      success
      title="Jogador cadastrado"
      description={`${player.name} entrou ${situation} e ${CONDITION_LABELS[player.condition]}. Valores em moedas, calculados pela API ao salvar.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onShowDetails}>
            <Eye aria-hidden />
            Ver detalhes
          </Button>
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      <ResultList
        items={[
          {
            label: 'Valor base',
            hint: 'Calculado no cadastro; não muda depois',
            value: formatMoney(player.base_value),
            highlight: true,
          },
          {
            label: 'Valor de mercado',
            hint: 'Com condição, agilidade e idade',
            value: formatMoney(player.market_value),
          },
          {
            label: 'Overall',
            hint: `Pelos pesos da posição ${POSITION_LABELS[player.position]}`,
            value: player.overall,
          },
        ]}
      />
    </Dialog>
  )
}
