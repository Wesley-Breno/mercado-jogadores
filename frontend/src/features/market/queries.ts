import { useMutation } from '@tanstack/react-query'

import { buyPlayer } from '../../api/players'
import type { BuyRequest } from '../../api/types'
import { useRefreshMarket } from '../../hooks/useRefreshMarket'

export function useBuyPlayer() {
  const refresh = useRefreshMarket()
  return useMutation({
    mutationFn: ({ playerId, purchase }: { playerId: number; purchase: BuyRequest }) =>
      buyPlayer(playerId, purchase),
    onSettled: refresh,
  })
}
