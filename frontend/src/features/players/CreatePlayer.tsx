import { Plus } from 'lucide-react'
import { useState } from 'react'

import type { Player } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { PlayerCreateDialog } from './PlayerCreateDialog'
import { PlayerCreatedDialog } from './PlayerCreatedDialog'

/** "Novo jogador": the form and, after saving, the values calculated by the API. */
export function CreatePlayer() {
  const [isFormOpen, setFormOpen] = useState(false)
  const [created, setCreated] = useState<Player | null>(null)

  return (
    <>
      <Button variant="primary" onClick={() => setFormOpen(true)}>
        <Plus aria-hidden />
        Novo jogador
      </Button>
      {isFormOpen && (
        <PlayerCreateDialog
          onClose={() => setFormOpen(false)}
          onCreated={(player) => {
            setFormOpen(false)
            setCreated(player)
          }}
        />
      )}
      {created && <PlayerCreatedDialog player={created} onClose={() => setCreated(null)} />}
    </>
  )
}
