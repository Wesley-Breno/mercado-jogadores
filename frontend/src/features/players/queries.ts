import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { listPlayers } from '../../api/players'
import type { PlayerQuery } from '../../api/types'
import { type Availability, countRequest } from './playerQuery'

const playerKeys = {
  list: (query: PlayerQuery) => ['players', 'list', query] as const,
}

/** While another page or filter loads, the previous rows stay on the screen. */
export function usePlayers(query: PlayerQuery) {
  return useQuery({
    queryKey: playerKeys.list(query),
    queryFn: () => listPlayers(query),
    placeholderData: keepPreviousData,
  })
}

function usePlayerCount(query: PlayerQuery, enabled: boolean) {
  return useQuery({
    queryKey: playerKeys.list(query),
    queryFn: () => listPlayers(query),
    select: (page) => page.meta.total_items,
    enabled,
  })
}

/** Counters of the tabs: the open tab reuses the list total, the others ask for one item. */
export function useAvailabilityCounts(
  request: PlayerQuery,
  current: Availability,
  currentTotal: number | undefined,
): Record<Availability, number | undefined> {
  const all = usePlayerCount(countRequest(request, 'all'), current !== 'all')
  const free = usePlayerCount(
    countRequest(request, 'free'),
    current !== 'free' && request.club_id === undefined,
  )
  const owned = usePlayerCount(countRequest(request, 'owned'), current !== 'owned')
  return {
    all: current === 'all' ? currentTotal : all.data,
    free: current === 'free' ? currentTotal : free.data,
    owned: current === 'owned' ? currentTotal : owned.data,
  }
}
