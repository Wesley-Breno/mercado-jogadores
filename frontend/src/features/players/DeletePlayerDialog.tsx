import type { Player } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { useToast } from '../../components/ui/toastContext'
import { useSingleAction } from '../../hooks/useSingleAction'
import { PlayerSummary } from './PlayerSummary'
import { useDeletePlayer } from './queries'

type DeletePlayerDialogProps = {
  player: Player
  onClose: () => void
}

/** J13: RN09 logical deletion; the list is fetched again and the player leaves it. */
export function DeletePlayerDialog({ player, onClose }: DeletePlayerDialogProps) {
  const toast = useToast()
  const deletePlayer = useDeletePlayer()
  const { run, isPending, error } = useSingleAction()

  function confirm() {
    run(
      () => deletePlayer.mutateAsync(player.id),
      () => {
        toast({
          title: 'Jogador excluído',
          description: `${player.name} saiu da lista. Transações e partidas antigas dele continuam gravadas.`,
        })
        onClose()
      },
    )
  }

  return (
    <Dialog
      title={`Excluir ${player.name}?`}
      description="O jogador sai da lista e da busca, mas as transações e as partidas antigas dele continuam como foram gravadas."
      onClose={() => !isPending && onClose()}
      footer={
        <DialogActions
          confirmLabel="Excluir jogador"
          pendingLabel="Excluindo…"
          destructive
          isPending={isPending}
          error={error}
          onCancel={onClose}
          onConfirm={confirm}
        />
      }
    >
      <PlayerSummary
        player={player}
        badge={<Badge tone="neutral">{player.club_id === null ? 'Livre' : 'Com clube'}</Badge>}
      />
    </Dialog>
  )
}
