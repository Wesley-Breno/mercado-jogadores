import type { ReactNode } from 'react'

import type { Player } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { POSITION_LABELS } from './labels'

/** The player the dialog is about: initials, name, position, age and a badge on the right. */
export function PlayerSummary({ player, badge }: { player: Player; badge: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <Avatar name={player.name} seed={player.id} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{player.name}</p>
        <p className="text-xs text-zinc-500">
          {player.position} · {POSITION_LABELS[player.position]} · {player.age} anos
        </p>
      </div>
      {badge}
    </div>
  )
}
