import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Volleyball } from 'lucide-react'

import type { Match, MatchSide } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { cn } from '../../lib/cn'
import { type Sector, SECTOR_OF } from '../lineup/lineupSlots'
import { PitchMarker, PitchSurface } from '../lineup/PitchSurface'
import { type FieldPlayer, describeStarter, duelValues, startersOf } from './matchLineups'

const SECTORS_FROM_GOAL: Sector[] = ['GOL', 'DEF', 'MEI', 'ATA']

type FieldSideProps = {
  side: MatchSide
  players: FieldPlayer[]
  home: boolean
}

/**
 * One club on its half: the goalkeeper by its goal and each sector towards the middle. On phones
 * the home club attacks upwards; from xl up it attacks to the right, as in the score.
 */
function FieldSide({ side, players, home }: FieldSideProps) {
  return (
    <section
      aria-label={`Titulares do ${side.club_name}, ${home ? 'mandante' : 'visitante'}, no ${side.formation}`}
      className={cn(
        'relative flex min-w-0 flex-1 gap-4 xl:gap-2',
        home
          ? 'flex-col-reverse pb-9 xl:flex-row xl:pt-9 xl:pb-0'
          : 'flex-col pt-9 xl:flex-row-reverse',
      )}
    >
      <p
        aria-hidden
        className={cn(
          'absolute flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs text-white',
          home ? 'bottom-0 left-0 xl:top-0 xl:bottom-auto' : 'top-0 right-0',
        )}
      >
        <span className={cn('size-2 rounded-full', home ? 'bg-blue-500' : 'bg-white')} />
        <span className="font-medium">{side.club_name}</span> {side.formation}
        <span className="text-white/70">· ataca</span>
        {home ? (
          <>
            <ArrowUp className="size-3.5 xl:hidden" />
            <ArrowRight className="hidden size-3.5 xl:block" />
          </>
        ) : (
          <>
            <ArrowDown className="size-3.5 xl:hidden" />
            <ArrowLeft className="hidden size-3.5 xl:block" />
          </>
        )}
      </p>
      {SECTORS_FROM_GOAL.map((sector) => {
        const line = players.filter((player) => SECTOR_OF[player.position] === sector)
        return (
          line.length > 0 && (
            <ul
              key={sector}
              className="flex min-w-0 flex-1 items-start justify-around gap-2 xl:flex-col xl:items-center"
            >
              {line.map((player) => (
                <li
                  key={player.id}
                  className="grid w-full max-w-28 min-w-0 justify-items-center gap-1 text-center"
                >
                  <PitchMarker
                    name={player.name}
                    tone={home ? 'home' : 'away'}
                    unfit={player.condition === 'MAL_CONDICIONADO'}
                    scored={player.attack?.goal}
                  />
                  <span
                    aria-hidden
                    className="max-w-full truncate rounded bg-black/25 px-1.5 text-xs font-medium text-white"
                  >
                    {player.name}
                  </span>
                  <span aria-hidden className="text-[11px] leading-tight text-white/80">
                    {duelValues(player)}
                  </span>
                  <span className="sr-only">{describeStarter(player)}</span>
                </li>
              ))}
            </ul>
          )
        )
      })}
    </section>
  )
}

/** The starters of both clubs on the pitch, with the values the API recorded in the duels. */
export function MatchField({ match }: { match: Match }) {
  return (
    <Card aria-label="Em campo" className="mb-5 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="font-semibold">Em campo</h2>
          <p className="text-xs text-zinc-500">
            Titulares de cada clube na formação da partida e os valores usados nos duelos, já com o
            efeito da condição.
          </p>
        </div>
        <p aria-hidden className="flex gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" />
            Mal condicionado
          </span>
          <span className="flex items-center gap-1.5">
            <Volleyball className="size-3.5" />
            Gol no duelo
          </span>
        </p>
      </div>
      <PitchSurface wide className="flex flex-col-reverse gap-6 p-3 xl:flex-row xl:px-5">
        <FieldSide side={match.home} players={startersOf(match, match.home.club_id)} home />
        <FieldSide side={match.away} players={startersOf(match, match.away.club_id)} home={false} />
      </PitchSurface>
    </Card>
  )
}
