import { Navigate, Route, Routes } from 'react-router'

import { PlayersPage } from '../features/players/PlayersPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/jogadores" replace />} />
        <Route path="jogadores" element={<PlayersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
