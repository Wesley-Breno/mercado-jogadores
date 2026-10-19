import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getMatch, listMatches, playMatch } from '../../api/matches'
import { matchKeys } from '../../api/queryKeys'

export function useMatches(clubId: number | undefined) {
  return useQuery({
    queryKey: matchKeys.list(clubId),
    queryFn: () => listMatches(clubId),
    placeholderData: keepPreviousData,
  })
}

export function useMatch(id: string) {
  return useQuery({ queryKey: matchKeys.detail(id), queryFn: () => getMatch(id) })
}

/**
 * The response is the match page itself (score and duels, nothing recalculated), and the history
 * is fetched again to include it.
 */
export function usePlayMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: playMatch,
    onSuccess: (match) => {
      queryClient.setQueryData(matchKeys.detail(String(match.id)), match)
      return queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    },
  })
}
