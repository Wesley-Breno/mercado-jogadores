import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Position } from '../../api/types'
import { Fieldset } from '../../components/ui/Field'
import { POSITION_LABELS } from './labels'
import { POSITIONS } from './playerQuery'

type PositionPickerProps = {
  registration: UseFormRegisterReturn
  error?: string
  lockedTo?: Position
}

/**
 * The five positions as radio cards. A player with a club keeps the position (409 in the API),
 * so the other cards are disabled.
 */
export function PositionPicker({ registration, error, lockedTo }: PositionPickerProps) {
  return (
    <Fieldset
      legend="Posição"
      error={error}
      hint={
        lockedTo && 'Jogador com clube não muda de posição: as outras posições ficam desabilitadas.'
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {POSITIONS.map((position) => (
          <label
            key={position}
            className="cursor-pointer rounded-lg border border-zinc-200 px-2 py-2 text-center shadow-xs transition-colors hover:bg-zinc-50 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-700 has-focus-visible:ring-3 has-focus-visible:ring-blue-600/30 has-disabled:cursor-not-allowed has-disabled:opacity-50"
          >
            <input
              type="radio"
              value={position}
              disabled={lockedTo !== undefined && lockedTo !== position}
              className="sr-only"
              {...registration}
            />
            <span className="block text-sm font-semibold">{position}</span>
            <span className="block text-xs text-zinc-500">{POSITION_LABELS[position]}</span>
          </label>
        ))}
      </div>
    </Fieldset>
  )
}
