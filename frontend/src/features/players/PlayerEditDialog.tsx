import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'

import type { Player, PlayerUpdate } from '../../api/types'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { useToast } from '../../components/ui/toastContext'
import { formatMoney } from '../../lib/format'
import { PlayerBasicFields } from './PlayerBasicFields'
import { type PlayerEditFields, editFieldsOf, playerEditSchema } from './playerForm'
import { useUpdatePlayer } from './queries'

type PlayerEditDialogProps = {
  player: Player
  onClose: () => void
}

/** RN08: PUT /players/{id} with name, position, age and agility. */
export function PlayerEditDialog({ player, onClose }: PlayerEditDialogProps) {
  const formId = useId()
  const toast = useToast()
  const updatePlayer = useUpdatePlayer()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PlayerEditFields, unknown, PlayerUpdate>({
    resolver: zodResolver(playerEditSchema(player)),
    defaultValues: editFieldsOf(player),
  })

  const submit = handleSubmit((changes) =>
    updatePlayer.mutateAsync({ id: player.id, player: changes }).then(
      (updated) => {
        toast({
          title: 'Jogador atualizado',
          description: `${updated.name} foi salvo. Valor de mercado: ${formatMoney(updated.market_value)}.`,
        })
        onClose()
      },
      (error: Error) => setError('root', { message: error.message }),
    ),
  )

  return (
    <Dialog
      title="Editar jogador"
      description="Edite nome, posição, idade e agilidade. Os demais dados não mudam."
      size="lg"
      onClose={() => !isSubmitting && onClose()}
      footer={
        <DialogActions
          formId={formId}
          confirmLabel="Salvar alterações"
          isPending={isSubmitting}
          error={errors.root?.message}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-5">
        <PlayerBasicFields
          fields={{
            name: register('name'),
            position: register('position'),
            age: register('age'),
            agility: register('agility'),
          }}
          errors={{
            name: errors.name?.message,
            position: errors.position?.message,
            age: errors.age?.message,
            agility: errors.agility?.message,
          }}
          ageHint={`De 16 a 45, sem diminuir (atual: ${player.age}).`}
          lockedPosition={player.club_id === null ? undefined : player.position}
        />
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2.5 text-xs text-zinc-500">
          <Lock aria-hidden className="size-3.5 shrink-0" />
          Não mudam depois do cadastro: valor base ({formatMoney(player.base_value)}), indicadores e
          potencial.
        </p>
      </form>
    </Dialog>
  )
}
