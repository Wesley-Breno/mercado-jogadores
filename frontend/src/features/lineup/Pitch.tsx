import type { Formation, Player } from '../../api/types'
import { initials } from '../../lib/initials'
import { cn } from '../../lib/cn'
import { type Sector, SECTOR_LABELS, slotsOf } from './lineupSlots'

const ROWS_FROM_ATTACK: Sector[] = ['ATA', 'MEI', 'DEF', 'GOL']

function lastName(name: string): string {
  return name.split(' ').at(-1) ?? name
}

type PitchProps = {
  formation: Formation
  starterOf: (slotKey: string) => Player | undefined
}

/**
 * C06: the chosen starters drawn on a pitch, from the attack (top) to the goalkeeper (bottom). It
 * follows the choices on screen, before saving; an empty place shows the sector it is waiting for.
 */
export function Pitch({ formation, starterOf }: PitchProps) {
  const rows = ROWS_FROM_ATTACK.map((sector) =>
    slotsOf(formation).filter((slot) => slot.sector === sector),
  ).filter((row) => row.length > 0)

  return (
    <figure className="m-0">
      <div className="relative grid gap-6 overflow-hidden rounded-lg bg-green-700 px-3 py-6 bg-[repeating-linear-gradient(0deg,transparent_0_2.5rem,rgb(255_255_255/0.05)_2.5rem_5rem)]">
        <span
          aria-hidden
          className="absolute top-0 left-1/2 h-12 w-32 -translate-x-1/2 border border-t-0 border-white/30"
        />
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
        />
        <span
          aria-hidden
          className="absolute bottom-0 left-1/2 h-12 w-32 -translate-x-1/2 border border-b-0 border-white/30"
        />
        {rows.map((row) => (
          <ul key={row[0].sector} className="relative flex justify-around">
            {row.map((slot) => {
              const player = starterOf(slot.key)
              const sector = SECTOR_LABELS[slot.sector].name
              const unfit = player?.condition === 'MAL_CONDICIONADO'
              return (
                <li key={slot.key} className="grid w-20 justify-items-center gap-1 text-center">
                  <span
                    aria-hidden
                    className={cn(
                      'relative grid size-10 place-items-center rounded-full text-xs font-semibold',
                      player
                        ? 'bg-blue-600 text-white ring-2 ring-white'
                        : 'border-2 border-dashed border-white/60 text-white/80',
                    )}
                  >
                    {player ? initials(player.name) : '+'}
                    {unfit && (
                      <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-amber-400 ring-2 ring-green-700" />
                    )}
                  </span>
                  <span aria-hidden className="max-w-full truncate text-xs font-medium text-white">
                    {player ? lastName(player.name) : sector}
                  </span>
                  <span className="sr-only">
                    {player
                      ? `${sector}: ${player.name}${unfit ? ', mal condicionado' : ''}`
                      : `${sector}: vaga vazia`}
                  </span>
                </li>
              )
            })}
          </ul>
        ))}
      </div>
      <figcaption className="mt-2 text-xs text-zinc-500">
        Na partida, atacam os 3 jogadores de linha mais avançados e defendem o goleiro e os 2 mais
        recuados. É gol quando o ataque é maior que a defesa.
      </figcaption>
    </figure>
  )
}
