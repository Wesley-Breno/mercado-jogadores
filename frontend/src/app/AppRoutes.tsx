import { Navigate, Route, Routes } from 'react-router'

import { ClubPage } from '../features/clubs/ClubPage'
import { ClubsPage } from '../features/clubs/ClubsPage'
import { MatchesPage } from '../features/matches/MatchesPage'
import { MatchPage } from '../features/matches/MatchPage'
import { PlayersPage } from '../features/players/PlayersPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
