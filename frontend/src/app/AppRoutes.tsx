import { type ComponentType, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

/** Each screen is a separate file of the build, downloaded the first time the screen opens. */
function lazyScreen<Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
) {
  return lazy(() => load().then((module) => ({ default: module[name] })))
}

const PlayersPage = lazyScreen(() => import('../features/players/PlayersPage'), 'PlayersPage')
const ClubsPage = lazyScreen(() => import('../features/clubs/ClubsPage'), 'ClubsPage')
const ClubPage = lazyScreen(() => import('../features/clubs/ClubPage'), 'ClubPage')
const MatchesPage = lazyScreen(() => import('../features/matches/MatchesPage'), 'MatchesPage')
const MatchPage = lazyScreen(() => import('../features/matches/MatchPage'), 'MatchPage')
const StandingsPage = lazyScreen(
  () => import('../features/standings/StandingsPage'),
  'StandingsPage',
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/jogadores" replace />} />
        <Route path="jogadores" element={<PlayersPage />} />
        <Route path="clubes" element={<ClubsPage />} />
        <Route path="clubes/:clubId" element={<ClubPage />} />
        <Route path="partidas" element={<MatchesPage />} />
        <Route path="partidas/:matchId" element={<MatchPage />} />
        <Route path="classificacao" element={<StandingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
