import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, Wallet } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'

import type { Club, ClubCreate } from '../../api/types'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { Field, Input } from '../../components/ui/Field'
import { type ClubCreateFields, clubCreateSchema } from './clubForm'
import { useCreateClub } from './queries'

type CreateClubDialogProps = {
  onClose: () => void
  onCreated: (club: Club) => void
}

/** C02: a repeated name or acronym and the 21st club are refused by the API (C03). */
export function CreateClubDialog({ onClose, onCreated }: CreateClubDialogProps) {
  const formId = useId()
  const createClub = useCreateClub()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClubCreateFields, unknown, ClubCreate>({
    resolver: zodResolver(clubCreateSchema),
    defaultValues: { name: '', acronym: '' },
  })

  const submit = handleSubmit((club) =>
    createClub
      .mutateAsync(club)
      .then(onCreated, (error: Error) => setError('root', { message: error.message })),
  )

  return (
    <Dialog
      title="Novo clube"
      description="Informe o nome e a sigla do clube."
      onClose={() => !isSubmitting && onClose()}
      footer={
        <DialogActions
          formId={formId}
          confirmLabel="Criar clube"
          isPending={isSubmitting}
          error={errors.root?.message}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <Field
          label="Nome"
          hint="De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube."
          error={errors.name?.message}
        >
          {(control) => (
            <Input {...control} icon={Shield} autoComplete="off" {...register('name')} />
          )}
        </Field>
        <Field
          label="Sigla"
          hint="3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome."
          error={errors.acronym?.message}
        >
          {(control) => (
            <Input
              {...control}
              maxLength={3}
              autoComplete="off"
              className="uppercase"
              {...register('acronym')}
            />
          )}
        </Field>
        <p className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
          <Wallet aria-hidden className="size-4 shrink-0" />O clube começa com 300,00 em caixa e sem
          jogadores.
        </p>
      </form>
    </Dialog>
  )
}
