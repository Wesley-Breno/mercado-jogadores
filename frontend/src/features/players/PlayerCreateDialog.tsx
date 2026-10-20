import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Lock } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'

import type { Player, PlayerCreate } from '../../api/types'
import { Dialog } from '../../components/ui/Dialog'
import { DialogActions } from '../../components/ui/DialogActions'
import { Field, Input } from '../../components/ui/Field'
import { EMPTY_PLAYER, INDICATORS, type PlayerCreateFields, playerCreateSchema } from './playerForm'
import { AttributePreview } from './AttributePreview'
import { PlayerBasicFields } from './PlayerBasicFields'
import { useCreatePlayer } from './queries'

type PlayerCreateDialogProps = {
  onClose: () => void
  onCreated: (player: Player) => void
}

function CalculatedField({ label, hint }: { label: string; hint: string }) {
  return (
    <Field label={label} hint={hint}>
      {(control) => <Input {...control} icon={Lock} value="Após salvar" disabled readOnly />}
    </Field>
  )
}

/** The button stays disabled while the request runs, so a double click sends one request. */
export function PlayerCreateDialog({ onClose, onCreated }: PlayerCreateDialogProps) {
  const formId = useId()
  const createPlayer = useCreatePlayer()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PlayerCreateFields, unknown, PlayerCreate>({
    resolver: zodResolver(playerCreateSchema),
    defaultValues: EMPTY_PLAYER,
  })

  const submit = handleSubmit((player) =>
    createPlayer
      .mutateAsync(player)
      .then(onCreated, (error: Error) => setError('root', { message: error.message })),
  )

  return (
    <Dialog
      size="lg"
      title="Novo jogador"
      description="Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar."
      onClose={() => !isSubmitting && onClose()}
      footer={
        <DialogActions
          formId={formId}
          confirmLabel="Salvar jogador"
          isPending={isSubmitting}
          error={errors.root?.message}
          note={
            <p className="mr-auto flex items-center gap-1.5 text-xs text-zinc-500">
              <Info aria-hidden className="size-3.5" />O jogador começa livre e Apto.
            </p>
          }
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-5">
        <PlayerBasicFields
          fields={{
            name: register('name'),
            position: register('position'),
            age: register('age'),
            agility: register('agility'),
          }}
          errors={{
            name: errors.name?.message,
            position: errors.position?.message,
            age: errors.age?.message,
            agility: errors.agility?.message,
          }}
          ageHint="De 16 a 45 anos."
          extra={<CalculatedField label="Valor base (moedas)" hint="Calculado no cadastro." />}
        />
        <section className="grid gap-3 border-t border-zinc-200 pt-5">
          <div>
            <h3 className="font-semibold">Indicadores técnicos</h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              Seis atributos e o potencial, de 1 a 99. Não mudam depois do cadastro; a soma dos seis
              atributos não pode passar de 480.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="grid grid-cols-2 content-start gap-4 sm:grid-cols-4">
              {INDICATORS.map(({ name, label }) => (
                <Field
                  key={name}
                  label={label}
                  hint={
                    name === 'potential'
                      ? 'Pelo menos o maior atributo; igual a ele com 33 anos ou mais.'
                      : undefined
                  }
                  error={errors[name]?.message}
                >
                  {(control) => <Input {...control} inputMode="numeric" {...register(name)} />}
                </Field>
              ))}
              <CalculatedField label="Overall" hint="Calculado pela API." />
            </div>
            <AttributePreview control={control} />
          </div>
        </section>
      </form>
    </Dialog>
  )
}
