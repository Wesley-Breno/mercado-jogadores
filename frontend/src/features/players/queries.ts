import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changeCondition,
  createPlayer,
  deletePlayer,
  listPlayers,
  updatePlayer,
} from '../../api/players'
import { playerKeys } from '../../api/queryKeys'
import type { Condition, PlayerQuery, PlayerUpdate } from '../../api/types'
import { useRefreshMarket } from '../../hooks/useRefreshMarket'
import { type Availability, countRequest } from './playerQuery'

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

const TOTAL_QUERY: PlayerQuery = { sort: 'name', page: 1, limit: 1 }

/** How many players the league has (the menu counter), read from `meta.total_items`. */
export function usePlayerTotal() {
  return useQuery({
    queryKey: playerKeys.list(TOTAL_QUERY),
    queryFn: () => listPlayers(TOTAL_QUERY),
    select: (page) => page.meta.total_items,
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

export function useUpdatePlayer() {
  const refresh = useRefreshMarket()
  return useMutation({
    mutationFn: ({ id, player }: { id: number; player: PlayerUpdate }) => updatePlayer(id, player),
    onSettled: refresh,
  })
}

export function useChangeCondition() {
  const refresh = useRefreshMarket()
  return useMutation({
    mutationFn: ({ id, condition }: { id: number; condition: Condition }) =>
      changeCondition(id, condition),
    onSettled: refresh,
  })
}

export function useDeletePlayer() {
  const refresh = useRefreshMarket()
  return useMutation({ mutationFn: deletePlayer, onSettled: refresh })
}
