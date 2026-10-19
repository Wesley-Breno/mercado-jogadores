import { ArrowRight, ListOrdered } from 'lucide-react'
import { Link } from 'react-router'

import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatDateTime } from '../../lib/format'
import { useClubs } from '../clubs/queries'
import { NewMatch } from '../matches/NewMatch'
import { useMatches } from '../matches/queries'
import { useStandings } from './queries'
import { StandingsTable } from './StandingsTable'

const RECENT_MATCHES = 3

const CRITERIA = [
  'Mais pontos',
  'Maior saldo de gols',
  'Mais gols marcados',
  'Nome do clube, de A a Z',
]

function RecentMatches() {
  const matches = useMatches(undefined)
  const recent = matches.data?.slice(0, RECENT_MATCHES) ?? []
  return (
    <Card aria-label="Últimas partidas">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="font-semibold">Últimas partidas</h2>
        <p className="text-xs text-zinc-500">Da mais recente para a mais antiga.</p>
      </div>
      <div className="grid gap-3 px-4 py-3 text-sm">
        {recent.length === 0 && <p className="text-zinc-500">Nenhuma partida jogada ainda.</p>}
        {recent.map((match) => (
          <Link key={match.id} to={`/partidas/${match.id}`} className="group block">
            <span className="block text-xs text-zinc-500">{formatDateTime(match.played_at)}</span>
            <span className="flex items-center gap-2 group-hover:underline">
              <span>{match.home.club_name}</span>
              <span className="rounded-md bg-zinc-100 px-1.5 font-semibold tabular-nums">
                {match.home.goals} × {match.away.goals}
              </span>
              <span>{match.away.club_name}</span>
            </span>
          </Link>
        ))}
        <Link
          to="/partidas"
          className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
        >
          Ver todas as partidas
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </Card>
  )
}

function TableOrder() {
  return (
    <Card>
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="font-semibold">Ordem da tabela</h2>
        <p className="text-xs text-zinc-500">Critérios da classificação, nesta ordem (RN21).</p>
      </div>
      <ol className="grid gap-2 px-4 py-3 text-sm">
        {CRITERIA.map((criterion, index) => (
          <li key={criterion} className="flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded bg-zinc-100 text-xs">
              {index + 1}
            </span>
            {criterion}
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** F14: the standings as GET /standings returns them, with the recent matches beside. */
export function StandingsPage() {
  const standings = useStandings()
  const clubs = useClubs()
  const clubsById = new Map((clubs.data ?? []).map((club) => [club.id, club]))

  return (
    <>
      <PageHeader
        icon={ListOrdered}
        title="Classificação"
        description="Todos os clubes, com 3 pontos por vitória e 1 por empate."
        action={<NewMatch variant="outline" />}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <StandingsTable
            rows={standings.data}
            clubs={clubsById}
            error={standings.error}
            onRetry={() => standings.refetch()}
          />
          <p className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
            J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols
            sofridos · SG: saldo de gols · Pts: pontos
          </p>
        </Card>
        <div className="grid gap-5">
          <RecentMatches />
          <TableOrder />
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Os clubes sem partidas aparecem zerados. Pontos, saldo e posição vêm da API, calculados a
        cada consulta (RN21); a tela não reordena nada.
      </p>
    </>
  )
}
