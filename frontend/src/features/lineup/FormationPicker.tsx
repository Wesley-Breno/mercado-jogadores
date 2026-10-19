import type { Formation } from '../../api/types'
import { Fieldset } from '../../components/ui/Field'
import { FORMATIONS } from './lineupSlots'

type FormationPickerProps = {
  selected: Formation
  onSelect: (formation: Formation) => void
}

/** The four formations of RN19 as radio cards. */
export function FormationPicker({ selected, onSelect }: FormationPickerProps) {
  return (
    <Fieldset
      legend="Formação"
      hint="Os números contam os jogadores de linha de trás para frente. O goleiro fica fora da conta."
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
          <label
            key={formation}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2 shadow-xs transition-colors hover:bg-zinc-50 has-checked:border-blue-600 has-checked:bg-blue-50 has-focus-visible:ring-3 has-focus-visible:ring-blue-600/30"
          >
            <input
              type="radio"
              name="formation"
              value={formation}
              checked={formation === selected}
              onChange={() => onSelect(formation)}
              className="mt-1 accent-blue-600"
            />
            <span>
              <span className="block text-sm font-semibold">{formation}</span>
              <span className="block text-xs text-zinc-500">
                {FORMATIONS[formation].description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Fieldset>
  )
}
