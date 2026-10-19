import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/jogadores" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
