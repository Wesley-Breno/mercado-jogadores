import { type FormEvent, useState } from 'react'

import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'

export type Range = {
  min: string | undefined
  max: string | undefined
}

type RangeFilterProps = {
  initial: Range
  hint: string
  invalidMessage: string
  inputMode: 'numeric' | 'decimal'
  parse: (text: string) => string | undefined
  onApply: (range: Range) => void
}

type Errors = Partial<Record<keyof Range, string>>

/** "De" and "Até" fields of a range filter; an empty side means no limit on that side. */
export function RangeFilter({
  initial,
  hint,
  invalidMessage,
  inputMode,
  parse,
  onApply,
}: RangeFilterProps) {
  const [texts, setTexts] = useState({ min: initial.min ?? '', max: initial.max ?? '' })
  const [errors, setErrors] = useState<Errors>({})

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const range: Range = {
      min: texts.min.trim() ? parse(texts.min) : undefined,
      max: texts.max.trim() ? parse(texts.max) : undefined,
    }
    const found: Errors = {
      min: texts.min.trim() && range.min === undefined ? invalidMessage : undefined,
      max: texts.max.trim() && range.max === undefined ? invalidMessage : undefined,
    }
    if (!found.max && range.min !== undefined && range.max !== undefined) {
      found.max =
        Number(range.min) > Number(range.max) ? 'Use um valor maior ou igual ao “De”.' : undefined
    }
    setErrors(found)
    if (!found.min && !found.max) {
      onApply(range)
    }
  }

  return (
    <form noValidate onSubmit={apply} className="grid gap-3 p-3 sm:w-72">
      <div className="grid grid-cols-2 gap-3">
        {(['min', 'max'] as const).map((side) => (
          <Field key={side} label={side === 'min' ? 'De' : 'Até'} error={errors[side]}>
            {(control) => (
              <Input
                {...control}
                autoFocus={side === 'min'}
                inputMode={inputMode}
                autoComplete="off"
                value={texts[side]}
                onChange={(event) => setTexts({ ...texts, [side]: event.target.value })}
              />
            )}
          </Field>
        ))}
      </div>
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => onApply({ min: undefined, max: undefined })}>
          Limpar
        </Button>
        <Button size="sm" variant="primary" type="submit">
          Aplicar filtro
        </Button>
      </div>
    </form>
  )
}
