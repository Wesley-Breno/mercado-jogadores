import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import type { Condition, Player } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { Fieldset } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toastContext'
import { formatMoney } from '../../lib/format'
import { CONDITION_LABELS } from './labels'
import { ConditionBadge } from './PlayerBadges'
import { type ConditionFields, conditionSchema } from './playerForm'
import { PlayerSummary } from './PlayerSummary'
import { CONDITIONS } from './playerQuery'
import { useChangeCondition } from './queries'

const EXPLANATIONS: Record<Condition, string> = {
  APTO: 'Sem desconto por condição.',
  MAL_CONDICIONADO:
    'Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.',
  DOENTE: 'Desconto de 30%, com o mesmo ajuste de agilidade.',
}

type ConditionDialogProps = {
  player: Player
  onClose: () => void
}

/** J10: from DOENTE straight to APTO is refused by the API, so that option is disabled. */
export function ConditionDialog({ player, onClose }: ConditionDialogProps) {
  const formId = useId()
  const toast = useToast()
  const changeCondition = useChangeCondition()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConditionFields>({
    resolver: zodResolver(conditionSchema),
    defaultValues: { condition: player.condition },
  })
  const chosen = useWatch({ control, name: 'condition' })

  const submit = handleSubmit(({ condition }) =>
    changeCondition.mutateAsync({ id: player.id, condition }).then(
      (updated) => {
        toast({
          title: 'Condição alterada',
          description: `${updated.name} agora está ${CONDITION_LABELS[updated.condition]}. Valor de mercado: ${formatMoney(updated.market_value)}.`,
        })
        onClose()
      },
      (error: Error) => setError('root', { message: error.message }),
    ),
  )

  return (
    <Dialog
      title="Alterar condição física"
      description="A condição muda o desconto do valor de mercado, recalculado ao salvar."
      onClose={() => !isSubmitting && onClose()}
      footer={
        <DialogActions
          formId={formId}
          confirmLabel="Salvar condição"
          isPending={isSubmitting}
          error={errors.root?.message}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <PlayerSummary player={player} badge={<ConditionBadge condition={player.condition} />} />
        <Fieldset legend="Nova condição" error={errors.condition?.message}>
          <div className="grid gap-2">
            {CONDITIONS.map((condition) => {
              const blocked = player.condition === 'DOENTE' && condition === 'APTO'
              return (
                <label
                  key={condition}
                  className="flex cursor-pointer gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 transition-colors hover:bg-zinc-50 has-checked:border-blue-600 has-checked:bg-blue-50 has-focus-visible:ring-3 has-focus-visible:ring-blue-600/30 has-disabled:cursor-not-allowed has-disabled:opacity-60"
                >
                  <input
                    type="radio"
                    value={condition}
                    disabled={blocked}
                    className="mt-1 accent-blue-600"
                    {...register('condition')}
                  />
                  <span className="grid gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {CONDITION_LABELS[condition]}
                      {condition === player.condition && <Badge>Atual</Badge>}
                    </span>
                    <span className="text-xs text-zinc-500">{EXPLANATIONS[condition]}</span>
                    {blocked && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Lock aria-hidden className="size-3" />
                        De Doente não passa direto para Apto.
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </Fieldset>
        {chosen === 'DOENTE' && player.condition !== 'DOENTE' && player.club_id !== null && (
          <Alert tone="warning">
            Se {player.name} for titular, sai da escalação ao passar a Doente, e o clube só volta a
            jogar depois de escalar de novo os 5 titulares.
          </Alert>
        )}
      </form>
    </Dialog>
  )
}
