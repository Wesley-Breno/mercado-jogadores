import type { ReactNode } from 'react'

import type { Player } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { formatMoney } from '../../lib/format'
import { POSITION_LABELS } from './labels'

/** The player the dialog is about: initials, name, position, age and, on the right, a badge or a value. */
export function PlayerSummary({ player, aside }: { player: Player; aside: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <Avatar name={player.name} seed={player.id} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{player.name}</p>
        <p className="text-xs text-zinc-500">
          {player.position} · {POSITION_LABELS[player.position]} · {player.age} anos
        </p>
      </div>
      {aside}
    </div>
  )
}

/** The aside of the buy and sell dialogs: the market value the deal will use. */
export function MarketValueAside({ value }: { value: number }) {
  return (
    <span className="text-right">
      <span className="block text-xs text-zinc-500">Valor de mercado</span>
      <span className="font-semibold tabular-nums">{formatMoney(value)}</span>
    </span>
  )
}
