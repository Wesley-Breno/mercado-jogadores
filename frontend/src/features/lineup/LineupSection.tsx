import type { ClubDetail } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/States'
import { useLineup } from '../clubs/queries'
import { LineupEditor } from './LineupEditor'

/** The "Escalação" tab: the editor starts again whenever the saved lineup changes. */
export function LineupSection({ club }: { club: ClubDetail }) {
  const lineup = useLineup(club.id)

  if (lineup.error) {
    return (
      <Card>
        <ErrorState message={lineup.error.message} onRetry={() => lineup.refetch()} />
      </Card>
    )
  }
  if (!lineup.data) {
    return (
      <Card className="p-4">
        <p role="status" className="sr-only">
          Carregando a escalação…
        </p>
        <span className="block h-64 animate-pulse rounded-lg bg-zinc-100" />
      </Card>
    )
  }
  const savedKey = `${lineup.data.formation}:${lineup.data.players.map((player) => player.id)}`
  return <LineupEditor key={savedKey} club={club} saved={lineup.data} />
}
