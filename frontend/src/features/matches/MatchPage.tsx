import { ArrowLeft, SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { ApiError } from '../../api/client'
import type { Match, MatchSide } from '../../api/types'
import { useBreadcrumbTail } from '../../app/breadcrumbContext'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { useMatch } from './queries'
import { Scoreboard } from './Scoreboard'
import { DuelsTable } from './DuelsTable'

function SideDuels({ match, side, role }: { match: Match; side: MatchSide; role: string }) {
  const duels = match.duels.filter((duel) => duel.attacking_club_id === side.club_id)
  return (
    <section aria-label={`Ataques do ${side.club_name}`}>
      <h3 className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium">
        <span>
          Ataques do {side.club_name} ({role})
        </span>
        <span className="text-xs text-zinc-500">
          {side.goals} {side.goals === 1 ? 'gol' : 'gols'}
        </span>
      </h3>
      <DuelsTable label={`Duelos do ${side.club_name}`} duels={duels} />
    </section>
  )
}

/** F13 and F14: the match with the 6 duels returned by the API (L03), without recalculating. */
export function MatchPage() {
  const { matchId = '' } = useParams()
  const match = useMatch(matchId)
  const title = match.data
    ? `${match.data.home.club_name} ${match.data.home.goals} × ${match.data.away.goals} ${match.data.away.club_name}`
    : undefined
  useBreadcrumbTail(title)

  if (match.error instanceof ApiError && match.error.status === 404) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="Partida não encontrada"
          description="A partida não existe ou o endereço está errado."
          action={<ButtonLink to="/partidas">Ver partidas</ButtonLink>}
        />
      </Card>
    )
  }
  if (match.error) {
    return (
      <Card>
        <ErrorState message={match.error.message} onRetry={() => match.refetch()} />
      </Card>
    )
  }

  return (
    <>
      <Link
        to="/partidas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-950"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para partidas
      </Link>
      {match.data ? (
        <>
          <Card className="mb-5 p-5">
            <h1 className="sr-only">{title}</h1>
            <Scoreboard match={match.data} />
          </Card>
          <Card>
            <div className="px-4 py-3">
              <h2 className="font-semibold">Duelos</h2>
              <p className="text-xs text-zinc-500">
                Os 3 ataques do mandante e depois os 3 do visitante, com os nomes, as condições e os
                valores do momento, já com o efeito da condição.
              </p>
            </div>
            <SideDuels match={match.data} side={match.data.home} role="mandante" />
            <SideDuels match={match.data} side={match.data.away} role="visitante" />
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <p role="status" className="sr-only">
            Carregando a partida…
          </p>
          <span className="block h-40 animate-pulse rounded-lg bg-zinc-100" />
        </Card>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Placar e duelos são os gravados pela API quando a partida foi jogada (RN20); a tela não
        recalcula nada.
      </p>
    </>
  )
}
