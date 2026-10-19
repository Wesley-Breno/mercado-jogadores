import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { NewMatchDialog } from './NewMatchDialog'

/** "Nova partida": after the API plays it, the match page opens with the score and the duels. */
export function NewMatch({ variant = 'primary' }: { variant?: 'primary' | 'outline' }) {
  const [isOpen, setOpen] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Nova partida
      </Button>
      {isOpen && (
        <NewMatchDialog
          onClose={() => setOpen(false)}
          onPlayed={(match) => {
            setOpen(false)
            toast({
              title: 'Partida jogada',
              description: `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}. Placar e duelos devolvidos pela API.`,
            })
            navigate(`/partidas/${match.id}`)
          }}
        />
      )}
    </>
  )
}
