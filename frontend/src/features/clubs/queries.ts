import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createClub, getClub, getLineup, listClubs } from '../../api/clubs'
import { clubKeys, lineupKeys } from '../../api/queryKeys'
import type { ClubSort } from '../../api/types'

/** The order always goes in the request, so the screen shows the clubs as the API sorted them. */
export function useClubs(sort: ClubSort = 'name') {
  return useQuery({
    queryKey: clubKeys.list(sort),
    queryFn: () => listClubs(sort),
    placeholderData: keepPreviousData,
  })
}

export function useClub(id: string) {
  return useQuery({ queryKey: clubKeys.detail(id), queryFn: () => getClub(id) })
}

export function useCreateClub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClub,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clubKeys.all }),
  })
}

/** The saved lineup of a club; without a club (a free player) nothing is asked. */
export function useLineup(clubId: number | null) {
  return useQuery({
    queryKey: lineupKeys.detail(String(clubId)),
    queryFn: () => getLineup(String(clubId)),
    enabled: clubId !== null,
  })
}

/** Whether the player is one of the starters saved for his club (RN19). */
export function useIsStarter(player: { id: number; club_id: number | null }): boolean {
  const lineup = useLineup(player.club_id)
  return lineup.data?.players.some((starter) => starter.id === player.id) ?? false
}
