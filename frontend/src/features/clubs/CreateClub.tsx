import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { formatMoney } from '../../lib/format'
import { CreateClubDialog } from './CreateClubDialog'

/**
 * "Novo clube": the header button and the one of the empty list open the same form. After saving,
 * the new club's page opens.
 */
type CreateClubProps = {
  variant?: 'primary' | 'outline'
  compact?: boolean
}

export function CreateClub({ variant = 'primary', compact = false }: CreateClubProps) {
  const [isOpen, setOpen] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  return (
    <>
      {compact ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label="Adicionar clube"
          title="Adicionar clube"
          className="size-7 px-0"
        >
          <Plus aria-hidden />
        </Button>
      ) : (
        <Button variant={variant} onClick={() => setOpen(true)}>
          <Plus aria-hidden />
          Novo clube
        </Button>
      )}
      {isOpen && (
        <CreateClubDialog
          onClose={() => setOpen(false)}
          onCreated={(club) => {
            setOpen(false)
            toast({
              title: 'Clube criado',
              description: `${club.name} (${club.acronym}) começa com ${formatMoney(club.cash)} em caixa.`,
            })
            navigate(`/clubes/${club.id}`)
          }}
        />
      )}
    </>
  )
}
