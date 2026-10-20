import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Clock, Info, Shield } from 'lucide-react'
import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import type { BuyRequest, Player, Purchase } from '../../api/types'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { Field, Input, Select } from '../../components/ui/Field'
import { maskDate, maskTime } from '../../lib/dateInput'
import { formatMoney } from '../../lib/format'
import { useClubs } from '../clubs/queries'
import { MarketValueAside, PlayerSummary } from '../players/PlayerSummary'
import { type BuyFields, buySchema } from './buyForm'
import { useBuyPlayer } from './queries'

type BuyPlayerDialogProps = {
  player: Player
  onClose: () => void
  onBought: (purchase: Purchase, clubName: string) => void
}

/**
 * M01: the buying club and the end of loyalty. Refusals such as more than 50% of the cash, a full
 * squad or a buy back come from the API (409) and are shown here (M04).
 */
export function BuyPlayerDialog({ player, onClose, onBought }: BuyPlayerDialogProps) {
  const formId = useId()
  const clubs = useClubs()
  const buyPlayer = useBuyPlayer()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BuyFields, unknown, BuyRequest>({
    resolver: zodResolver(buySchema),
    defaultValues: { club_id: '', date: '', time: '' },
  })
  const chosenClubId = useWatch({ control, name: 'club_id' })
  const buyer = clubs.data?.find((club) => String(club.id) === chosenClubId)
  const date = register('date')
  const time = register('time')

  const submit = handleSubmit((purchase) =>
    buyPlayer.mutateAsync({ playerId: player.id, purchase }).then(
      (result) => onBought(result, buyer?.name ?? ''),
      (error: Error) => setError('root', { message: error.message }),
    ),
  )

  return (
    <Dialog
      title="Comprar jogador"
      description="Escolha o clube comprador e até quando vai a fidelidade do contrato."
      onClose={() => !isSubmitting && onClose()}
      footer={
        <DialogActions
          formId={formId}
          confirmLabel="Confirmar compra"
          pendingLabel="Comprando…"
          isPending={isSubmitting}
          error={errors.root?.message}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <PlayerSummary player={player} aside={<MarketValueAside value={player.market_value} />} />
        <Field
          label="Clube comprador"
          hint={
            buyer
              ? `Caixa atual: ${formatMoney(buyer.cash)}. O custo total (valor + taxa) pode ir até 50% do caixa.`
              : 'O custo total (valor + taxa) pode ir até 50% do caixa do clube.'
          }
          error={errors.club_id?.message}
        >
          {(control) => (
            <Select {...control} icon={Shield} disabled={!clubs.data} {...register('club_id')}>
              <option value="">{clubs.data ? 'Escolha o clube' : 'Carregando os clubes…'}</option>
              {clubs.data?.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} ({club.acronym}) · caixa {formatMoney(club.cash)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Fim da fidelidade</legend>
          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <Field label={<span className="sr-only">Data</span>} error={errors.date?.message}>
              {(control) => (
                <Input
                  {...control}
                  {...date}
                  icon={CalendarDays}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="dd/mm/aaaa"
                  onChange={(event) => {
                    event.target.value = maskDate(event.target.value)
                    return date.onChange(event)
                  }}
                />
              )}
            </Field>
            <Field label={<span className="sr-only">Hora</span>} error={errors.time?.message}>
              {(control) => (
                <Input
                  {...control}
                  {...time}
                  icon={Clock}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="hh:mm"
                  onChange={(event) => {
                    event.target.value = maskTime(event.target.value)
                    return time.onChange(event)
                  }}
                />
              )}
            </Field>
          </div>
          <p className="text-xs text-zinc-500">
            Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso
            (-03:00).
          </p>
        </fieldset>
        <p className="flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          <Info aria-hidden className="size-4 shrink-0" />A taxa é de 5% do valor de mercado, só
          quando ele passa de 30,00. Taxa, custo e novo caixa são calculados pela API ao confirmar.
        </p>
      </form>
    </Dialog>
  )
}
