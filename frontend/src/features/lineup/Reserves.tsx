import { Lock } from 'lucide-react'

import type { Player } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { ConditionBadge } from '../players/PlayerBadges'
import { POSITION_LABELS } from '../players/labels'

/** The squad players left out of the lineup; a sick player cannot be chosen (RN19). */
export function Reserves({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhum reserva: todos os jogadores do elenco estão escolhidos.
      </p>
    )
  }
  return (
    <ul className="grid gap-2">
      {players.map((player) => (
        <li key={player.id} className="rounded-lg border border-zinc-200 px-3 py-2">
          <span className="flex items-center gap-2">
            <Avatar name={player.name} seed={player.id} className="size-7" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{player.name}</span>
              <span className="block text-xs text-zinc-500">
                {POSITION_LABELS[player.position]}
              </span>
            </span>
            <ConditionBadge condition={player.condition} />
          </span>
          {player.condition === 'DOENTE' && (
            <span className="mt-1.5 flex items-center gap-1 text-xs text-zinc-500">
              <Lock aria-hidden className="size-3" />
              Doente não pode ser escalado.
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
