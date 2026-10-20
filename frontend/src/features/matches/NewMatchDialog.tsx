import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Shield } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'

import type { Match, MatchRequest } from '../../api/types'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { Field, Select } from '../../components/ui/Field'
import { useClubs } from '../clubs/queries'
import { type MatchFields, matchSchema } from './matchForm'
import { usePlayMatch } from './queries'

type NewMatchDialogProps = {
  onClose: () => void
  onPlayed: (match: Match) => void
}

/** RN20: a club without the 5 starters is refused by the API (409), and its `message` shows. */
export function NewMatchDialog({ onClose, onPlayed }: NewMatchDialogProps) {
  const formId = useId()
  const clubs = useClubs()
  const playMatch = usePlayMatch()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MatchFields, unknown, MatchRequest>({
    resolver: zodResolver(matchSchema),
    defaultValues: { home_club_id: '', away_club_id: '' },
  })

  const submit = handleSubmit((match) =>
    playMatch
      .mutateAsync(match)
      .then(onPlayed, (error: Error) => setError('root', { message: error.message })),
  )

  const options = (
    <>
      <option value="">{clubs.data ? 'Escolha o clube' : 'Carregando os clubes…'}</option>
      {clubs.data?.map((club) => (
        <option key={club.id} value={club.id}>
          {club.name} ({club.acronym})
        </option>
      ))}
    </>
  )

  return (
    <Dialog
      title="Nova partida"
      description="Escolha o mandante e o visitante. O placar sai dos atributos dos titulares, sem sorteio."
      onClose={() => !isSubmitting && onClose()}
      footer={
        <DialogActions
          formId={formId}
          confirmLabel="Jogar partida"
          pendingLabel="Jogando…"
          isPending={isSubmitting}
          error={errors.root?.message}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <Field
          label="Mandante"
          hint="Faz os 3 primeiros ataques."
          error={errors.home_club_id?.message}
        >
          {(control) => (
            <Select {...control} icon={Shield} disabled={!clubs.data} {...register('home_club_id')}>
              {options}
            </Select>
          )}
        </Field>
        <Field
          label="Visitante"
          hint="Precisa ser um clube diferente do mandante."
          error={errors.away_club_id?.message}
        >
          {(control) => (
            <Select {...control} icon={Shield} disabled={!clubs.data} {...register('away_club_id')}>
              {options}
            </Select>
          )}
        </Field>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-900">
            <Info aria-hidden className="size-4" />
            Como sai o placar
          </p>
          Cada time faz 3 ataques. Pela ordem do elenco, os jogadores de linha vão do 1º (o mais
          recuado) ao 4º (o mais avançado): o 4º enfrenta o goleiro, o 3º enfrenta o 1º e o 2º
          enfrenta o 2º do adversário. O atacante usa finalização (ATA), passe (MEI) ou drible (ZAG
          e LAT), e quem defende usa defesa. É gol só quando o ataque é maior; mal condicionado joga
          com 15% a menos. Os dois clubes precisam ter os 5 titulares escalados, e a partida não
          mexe no caixa.
        </div>
      </form>
    </Dialog>
  )
}
