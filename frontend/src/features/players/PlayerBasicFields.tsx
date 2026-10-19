import { User } from 'lucide-react'
import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Position } from '../../api/types'
import { Field, Input } from '../../components/ui/Field'
import { PositionPicker } from './PositionPicker'

type BasicField = 'name' | 'position' | 'age' | 'agility'

type PlayerBasicFieldsProps = {
  fields: Record<BasicField, UseFormRegisterReturn>
  errors: Partial<Record<BasicField, string>>
  ageHint: string
  lockedPosition?: Position
  extra?: ReactNode
}

/** Name, position, age and agility: the part shared by the new player and the edit forms. */
export function PlayerBasicFields({
  fields,
  errors,
  ageHint,
  lockedPosition,
  extra,
}: PlayerBasicFieldsProps) {
  return (
    <>
      <Field
        label="Nome"
        hint="De 3 a 100 caracteres, com pelo menos duas palavras e sem números."
        error={errors.name}
      >
        {(control) => <Input {...control} icon={User} autoComplete="off" {...fields.name} />}
      </Field>
      <PositionPicker
        registration={fields.position}
        error={errors.position}
        lockedTo={lockedPosition}
      />
      <div className={extra ? 'grid gap-4 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-2'}>
        <Field label="Idade" hint={ageHint} error={errors.age}>
          {(control) => <Input {...control} inputMode="numeric" {...fields.age} />}
        </Field>
        <Field
          label="Agilidade"
          hint="De 1 a 100 (até 85 com 35 anos ou mais)."
          error={errors.agility}
        >
          {(control) => <Input {...control} inputMode="numeric" {...fields.agility} />}
        </Field>
        {extra}
      </div>
    </>
  )
}
