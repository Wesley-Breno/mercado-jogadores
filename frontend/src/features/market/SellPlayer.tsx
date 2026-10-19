import { useState } from 'react'

import type { Sale, SquadPlayer } from '../../api/types'
import { SaleResultDialog } from './SaleResultDialog'
import { SellPlayerDialog } from './SellPlayerDialog'

type SellPlayerProps = {
  player: SquadPlayer
  clubName: string
  onClose: () => void
}

/** F08: the confirmation and, once the API accepts, every value of the sale. */
export function SellPlayer({ player, clubName, onClose }: SellPlayerProps) {
  const [result, setResult] = useState<{ sale: Sale; wasStarter: boolean } | null>(null)

  if (result) {
    return (
      <SaleResultDialog
        sale={result.sale}
        wasStarter={result.wasStarter}
        clubName={clubName}
        onClose={onClose}
      />
    )
  }
  return (
    <SellPlayerDialog
      player={player}
      clubName={clubName}
      onClose={onClose}
      onSold={(sale, wasStarter) => setResult({ sale, wasStarter })}
    />
  )
}
