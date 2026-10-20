import type { Formation, Player } from '../../api/types'
import { type Sector, SECTOR_LABELS, slotsOf } from './lineupSlots'
import { PitchMarker, PitchSurface } from './PitchSurface'

const ROWS_FROM_ATTACK: Sector[] = ['ATA', 'MEI', 'DEF', 'GOL']

function lastName(name: string): string {
  return name.split(' ').at(-1) ?? name
}

type PitchProps = {
  formation: Formation
  starterOf: (slotKey: string) => Player | undefined
}

/**
 * The chosen starters drawn on a pitch, from the attack (top) to the goalkeeper (bottom). It
 * follows the choices on screen, before saving; an empty place shows the sector it is waiting for.
 */
export function Pitch({ formation, starterOf }: PitchProps) {
  const rows = ROWS_FROM_ATTACK.map((sector) =>
    slotsOf(formation).filter((slot) => slot.sector === sector),
  ).filter((row) => row.length > 0)

  return (
    <figure className="m-0">
      <PitchSurface className="grid gap-6 px-3 py-6">
        {rows.map((row) => (
          <ul key={row[0].sector} className="relative flex justify-around">
            {row.map((slot) => {
              const player = starterOf(slot.key)
              const sector = SECTOR_LABELS[slot.sector].name
              const unfit = player?.condition === 'MAL_CONDICIONADO'
              return (
                <li key={slot.key} className="grid w-20 justify-items-center gap-1 text-center">
                  {player ? (
                    <PitchMarker name={player.name} unfit={unfit} />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-10 place-items-center rounded-full border-2 border-dashed border-white/60 text-xs font-semibold text-white/80"
                    >
                      +
                    </span>
                  )}
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
      </PitchSurface>
      <figcaption className="mt-2 text-xs text-zinc-500">
        Na partida, atacam os 3 jogadores de linha mais avançados e defendem o goleiro e os 2 mais
        recuados. É gol quando o ataque é maior que a defesa.
      </figcaption>
    </figure>
  )
}
