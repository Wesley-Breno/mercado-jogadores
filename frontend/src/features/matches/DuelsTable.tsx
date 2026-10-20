import type { Duel, DuelPlayer } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { CONDITION_LABELS } from '../players/labels'
import { ATTRIBUTE_LABELS } from './labels'

function DuelPlayerCell({ player }: { player: DuelPlayer }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar name={player.player_name} seed={player.player_id} className="size-7" />
      <span>
        <span className="block font-medium text-zinc-950">{player.player_name}</span>
        <span className="block text-xs text-zinc-500">
          {player.position}
          {player.condition !== 'APTO' && ` · ${CONDITION_LABELS[player.condition]}`}
        </span>
      </span>
    </span>
  )
}

function AttributeValue({ player }: { player: DuelPlayer }) {
  return (
    <span>
      <span className="text-zinc-500">{ATTRIBUTE_LABELS[player.attribute]}</span>{' '}
      <span className="font-semibold">{player.value}</span>
    </span>
  )
}

const COLUMNS: Column<Duel>[] = [
  { key: 'order', header: 'Duelo', cell: (duel) => duel.order },
  {
    key: 'attacker',
    header: 'Atacante',
    cell: (duel) => <DuelPlayerCell player={duel.attacker} />,
  },
  { key: 'attack', header: 'Ataque', cell: (duel) => <AttributeValue player={duel.attacker} /> },
  {
    key: 'defender',
    header: 'Defensor',
    cell: (duel) => <DuelPlayerCell player={duel.defender} />,
  },
  { key: 'defence', header: 'Defesa', cell: (duel) => <AttributeValue player={duel.defender} /> },
  {
    key: 'goal',
    header: 'Resultado',
    cell: (duel) =>
      duel.goal ? (
        <Badge tone="success" dot>
          Gol
        </Badge>
      ) : (
        <Badge tone="neutral">Sem gol</Badge>
      ),
  },
]

/** RN20: the duels of one side as the API returned them, values already with the condition. */
export function DuelsTable({ label, duels }: { label: string; duels: Duel[] }) {
  return (
    <DataTable
      label={label}
      columns={COLUMNS}
      rows={duels}
      rowKey={(duel) => duel.order}
      error={null}
      empty={null}
    />
  )
}
