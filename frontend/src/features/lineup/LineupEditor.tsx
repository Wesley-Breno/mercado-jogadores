import { Info } from 'lucide-react'
import { useState } from 'react'

import type { ClubDetail, Formation, Lineup, Player } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useToast } from '../../components/ui/toastContext'
import { useSingleAction } from '../../hooks/useSingleAction'
import { FormationPicker } from './FormationPicker'
import {
  type Choices,
  candidatesFor,
  distribute,
  missingSlots,
  playerIds,
  slotsOf,
} from './lineupSlots'
import { useSaveLineup } from './queries'
import { SlotRow } from './SlotRow'

const DEFAULT_FORMATION: Formation = '2-1-1'
const LINEUP_SIZE = 5

const names = new Intl.ListFormat('pt-BR', { type: 'conjunction' })

function IncompleteWarning({ clubName, saved }: { clubName: string; saved: Lineup }) {
  return (
    <Alert tone="warning">
      <strong className="block font-medium">
        Escalação incompleta: o {clubName} não pode jogar partidas
      </strong>
      {saved.formation === null
        ? 'O clube ainda não escalou os 5 titulares. Escolha a formação e um titular para cada vaga e salve.'
        : `A formação ${saved.formation} continua salva, com ${saved.players.length} de ${LINEUP_SIZE} titulares. Titular vendido ou que ficou Doente sai da escalação; escolha quem falta e salve de novo.`}
    </Alert>
  )
}

function UnfitWarning({ players }: { players: Player[] }) {
  const single = players.length === 1
  return (
    <Alert tone="warning">
      <strong className="block font-medium">
        {names.format(players.map((player) => player.name))}{' '}
        {single ? 'está mal condicionado' : 'estão mal condicionados'}
      </strong>
      {single ? 'Pode' : 'Podem'} jogar, mas cada atributo vale 15% a menos durante a partida.
    </Alert>
  )
}

type LineupEditorProps = {
  club: ClubDetail
  saved: Lineup
}

/**
 * F12: formation and one starter per place, chosen among squad players who are not DOENTE. It
 * starts from the saved lineup and, after saving, shows the one returned by the API.
 */
export function LineupEditor({ club, saved }: LineupEditorProps) {
  const toast = useToast()
  const saveLineup = useSaveLineup(club.id)
  const { run, isPending, error } = useSingleAction()
  const initialFormation = saved.formation ?? DEFAULT_FORMATION
  const [formation, setFormation] = useState(initialFormation)
  const [choices, setChoices] = useState<Choices>(() => distribute(initialFormation, saved.players))
  const [missing, setMissing] = useState<string[]>([])
  const squadById = new Map(club.players.map((player) => [player.id, player]))
  const starters = playerIds(formation, choices).flatMap((id) => squadById.get(id) ?? [])
  const unfit = starters.filter((player) => player.condition === 'MAL_CONDICIONADO')

  function starterOf(slotKey: string): Player | undefined {
    const playerId = choices[slotKey]
    return playerId === undefined ? undefined : squadById.get(playerId)
  }

  function chooseFormation(next: Formation) {
    setFormation(next)
    setChoices(distribute(next, starters))
    setMissing([])
  }

  function choose(slotKey: string, playerId: number | undefined) {
    setChoices({ ...choices, [slotKey]: playerId })
    setMissing(missing.filter((key) => key !== slotKey))
  }

  function cancel() {
    setFormation(initialFormation)
    setChoices(distribute(initialFormation, saved.players))
    setMissing([])
  }

  function submit() {
    const empty = missingSlots(formation, choices)
    setMissing(empty)
    if (empty.length > 0) {
      return
    }
    run(
      () => saveLineup.mutateAsync({ formation, player_ids: playerIds(formation, choices) }),
      (result) =>
        toast({
          title: 'Escalação salva',
          description: `${club.name} na formação ${result.formation}, com ${result.players.length} titulares.`,
        }),
    )
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h2 className="font-semibold">Titulares</h2>
          <p className="text-xs text-zinc-500">
            1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar troca os 5 de uma vez.
          </p>
        </div>
        <Badge tone={saved.complete ? 'success' : 'warning'} dot>
          {saved.complete ? 'Completa' : 'Incompleta'}
        </Badge>
      </div>
      <div className="grid gap-4 px-4 py-4">
        {!saved.complete && <IncompleteWarning clubName={club.name} saved={saved} />}
        <FormationPicker selected={formation} onSelect={chooseFormation} />
      </div>
      {slotsOf(formation).map((slot) => (
        <SlotRow
          key={slot.key}
          slot={slot}
          chosen={starterOf(slot.key)}
          candidates={candidatesFor(slot, club.players, choices)}
          error={missing.includes(slot.key) ? 'Escolha um titular para esta vaga.' : undefined}
          onChoose={(playerId) => choose(slot.key, playerId)}
        />
      ))}
      <div className="grid gap-3 border-t border-zinc-200 px-4 py-4">
        {unfit.length > 0 && <UnfitWarning players={unfit} />}
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="mr-auto flex max-w-md gap-1.5 text-xs text-zinc-500">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />A escalação vale até ser
            trocada. Titular vendido ou que fica Doente sai dela, e o clube só volta a jogar depois
            de escalar de novo os 5 titulares.
          </p>
          <Button onClick={cancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Salvando…' : 'Salvar escalação'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
