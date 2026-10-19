import { useQueryClient } from '@tanstack/react-query'

import { clubKeys, lineupKeys, playerKeys } from '../api/queryKeys'

/**
 * A player that changes, is bought or is sold moves market values, squads, cash and lineups (a sold
 * or sick starter leaves it), so all of them are fetched again; also after a refusal, when the data
 * on screen may be old.
 */
export function useRefreshMarket() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: playerKeys.all }),
      queryClient.invalidateQueries({ queryKey: clubKeys.all }),
      queryClient.invalidateQueries({ queryKey: lineupKeys.all }),
    ])
}
