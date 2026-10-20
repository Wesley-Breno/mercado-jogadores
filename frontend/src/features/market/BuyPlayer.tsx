import { useState } from 'react'

import type { Player, Purchase } from '../../api/types'
import { BuyPlayerDialog } from './BuyPlayerDialog'
import { PurchaseResultDialog } from './PurchaseResultDialog'

type BuyPlayerProps = {
  player: Player
  onClose: () => void
}

/** The purchase form and, once the API accepts, the result of the purchase. */
export function BuyPlayer({ player, onClose }: BuyPlayerProps) {
  const [result, setResult] = useState<{ purchase: Purchase; clubName: string } | null>(null)

  if (result) {
    return (
      <PurchaseResultDialog
        purchase={result.purchase}
        clubName={result.clubName}
        onClose={onClose}
      />
    )
  }
  return (
    <BuyPlayerDialog
      player={player}
      onClose={onClose}
      onBought={(purchase, clubName) => setResult({ purchase, clubName })}
    />
  )
}
