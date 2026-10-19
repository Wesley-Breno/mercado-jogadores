import type { Player } from '../../api/types'
import { Field, Select } from '../../components/ui/Field'
import { ConditionBadge } from '../players/PlayerBadges'
import { type Slot, SECTOR_LABELS } from './lineupSlots'

type AttackAttribute = { label: string; value: 'dribbling' | 'passing' | 'shooting' }

const ATTACK_ATTRIBUTE: Record<Player['position'], AttackAttribute | null> = {
  GOL: null,
  ZAG: { label: 'Drible', value: 'dribbling' },
  LAT: { label: 'Drible', value: 'dribbling' },
  MEI: { label: 'Passe', value: 'passing' },
  ATA: { label: 'Finalização', value: 'shooting' },
}

/** RN20 uses the attack attribute of the position and, to defend, always `defending`. */
function matchAttributes(player: Player): string {
  const attack = ATTACK_ATTRIBUTE[player.position]
  const defence = `Defesa ${player.defending}`
  return attack ? `${attack.label} ${player[attack.value]} · ${defence}` : defence
}

type SlotRowProps = {
  slot: Slot
  chosen: Player | undefined
  candidates: Player[]
  error?: string
  onChoose: (playerId: number | undefined) => void
}

/** One place of the formation: the select of the starter and, once chosen, what he brings. */
export function SlotRow({ slot, chosen, candidates, error, onChoose }: SlotRowProps) {
  const { name, positions } = SECTOR_LABELS[slot.sector]
  return (
    <div className="grid items-start gap-3 border-t border-zinc-200 px-4 py-3 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <Field label={name} hint={positions} error={error} inline>
        {(control) => (
          <Select
            {...control}
            value={chosen?.id ?? ''}
            onChange={(event) =>
              onChoose(event.target.value ? Number(event.target.value) : undefined)
            }
          >
            <option value="">
              {candidates.length ? 'Escolha o titular' : `Sem ${positions} disponível`}
            </option>
            {candidates.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.position})
              </option>
            ))}
          </Select>
        )}
      </Field>
      {chosen && (
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:pt-2">
          <dt className="sr-only">Condição</dt>
          <dd>
            <ConditionBadge condition={chosen.condition} />
          </dd>
          <dt className="text-zinc-500">Overall</dt>
          <dd className="-ml-3 font-semibold tabular-nums">{chosen.overall}</dd>
          <dt className="sr-only">Atributos da partida</dt>
          <dd className="text-zinc-600 tabular-nums">{matchAttributes(chosen)}</dd>
        </dl>
      )}
    </div>
  )
}
