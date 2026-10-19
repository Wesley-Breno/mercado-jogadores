import { useQueryClient } from '@tanstack/react-query'

import { clubKeys, playerKeys } from '../api/queryKeys'

/**
 * A player that changes, is bought or is sold moves market values, squads and cash, so players and
 * clubs are fetched again; also after a refusal, when the data on screen may be old.
 */
export function useRefreshMarket() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: playerKeys.all }),
      queryClient.invalidateQueries({ queryKey: clubKeys.all }),
    ])
}
