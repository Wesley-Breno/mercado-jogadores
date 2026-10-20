import { BarChart3 } from 'lucide-react'
import { type Control, useWatch } from 'react-hook-form'

import { AttributeBars } from '../../components/ui/AttributeBars'
import type { PlayerCreate } from '../../api/types'
import { ATTRIBUTES, type PlayerCreateFields, typedIndicator } from './playerForm'

const WATCHED = [...ATTRIBUTES.map((attribute) => attribute.name), 'potential'] as const

/** Draws the numbers being typed; overall and base value only come from the API. */
type AttributePreviewProps = {
  control: Control<PlayerCreateFields, unknown, PlayerCreate>
}

export function AttributePreview({ control }: AttributePreviewProps) {
  const texts = useWatch({ control, name: [...WATCHED] })
  const potentialText = texts[texts.length - 1]
  const hasWrongValue = texts.some(
    (text) => (text ?? '').trim() !== '' && typedIndicator(text) === undefined,
  )

  return (
    <aside
      aria-label="Prévia dos atributos"
      className="grid content-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <BarChart3 aria-hidden className="size-3.5" />
        Prévia dos atributos
      </p>
      {hasWrongValue ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Corrija os valores destacados para ver a prévia.
        </p>
      ) : (
        <AttributeBars
          attributes={ATTRIBUTES.map(({ label }, index) => ({
            label,
            value: typedIndicator(texts[index]),
          }))}
          potential={typedIndicator(potentialText)}
        />
      )}
      <p className="text-xs text-zinc-500">
        A prévia só desenha os valores digitados; não calcula overall nem valor base.
      </p>
    </aside>
  )
}
