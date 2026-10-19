import { Navigate, Route, Routes } from 'react-router'

import { ClubsPage } from '../features/clubs/ClubsPage'
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
