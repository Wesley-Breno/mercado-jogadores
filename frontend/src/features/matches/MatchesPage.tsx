import { ChevronRight, Shield, Swords } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/States'
import { useClubs } from '../clubs/queries'
import { MatchesTable } from './MatchesTable'
import { NewMatch } from './NewMatch'
import { useMatches } from './queries'
import { Scoreboard } from './Scoreboard'

const POSITIVE_INTEGER = /^[1-9][0-9]*$/

/** F13 and F14: play a match and browse the history, filtered by club (kept in the address). */
export function MatchesPage() {
  const [params, setParams] = useSearchParams()
  const rawClubId = params.get('club_id') ?? ''
  const clubId = POSITIVE_INTEGER.test(rawClubId) ? Number(rawClubId) : undefined
  const matches = useMatches(clubId)
  const latest = useMatches(undefined).data?.[0]
  const clubs = useClubs()
  const count = matches.data?.length

  return (
    <>
      <PageHeader
        icon={Swords}
        title="Partidas"
        description="Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico."
        action={<NewMatch />}
      />
      {latest && (
        <section aria-label="Última partida" className="mb-5">
          <h2 className="mb-2 text-sm text-zinc-500">Última partida</h2>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex-1">
              <Scoreboard match={latest} />
            </div>
            <ButtonLink to={`/partidas/${latest.id}`}>
              Ver duelos
              <ChevronRight aria-hidden />
            </ButtonLink>
          </Card>
        </section>
      )}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="font-semibold">Histórico de partidas</h2>
            <p className="text-xs text-zinc-500">Da mais recente para a mais antiga.</p>
          </div>
          <label className="w-60">
            <span className="sr-only">Clube</span>
            <Select
              icon={Shield}
              value={clubId ?? ''}
              onChange={(event) =>
                setParams(event.target.value ? { club_id: event.target.value } : {})
              }
            >
              <option value="">Clube: todos</option>
              {clubs.data?.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <MatchesTable
          matches={matches.data}
          isUpdating={matches.isPlaceholderData}
          error={matches.error}
          onRetry={() => matches.refetch()}
          empty={
            <EmptyState
              icon={Swords}
              title="Nenhuma partida jogada"
              description={
                clubId
                  ? 'Esse clube ainda não jogou nenhuma partida.'
                  : 'Jogue a primeira partida entre dois clubes com os 5 titulares escalados.'
              }
              action={clubId ? undefined : <NewMatch variant="outline" />}
            />
          }
        />
        {count !== undefined && count > 0 && (
          <p className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-500">
            {count} {count === 1 ? 'partida' : 'partidas'}
          </p>
        )}
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        Partidas da mais recente para a mais antiga, na ordem da API. "Ver duelos" abre a partida.
      </p>
    </>
  )
}
