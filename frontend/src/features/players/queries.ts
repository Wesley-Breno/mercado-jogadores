import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createPlayer, listPlayers } from '../../api/players'
import type { PlayerQuery } from '../../api/types'
import { type Availability, countRequest } from './playerQuery'

const playerKeys = {
  all: ['players'] as const,
  list: (query: PlayerQuery) => [...playerKeys.all, 'list', query] as const,
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

/** The lists are fetched again before the success shows, so the new player is already there. */
export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playerKeys.all }),
  })
}
