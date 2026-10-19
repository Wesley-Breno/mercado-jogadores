const SCALE_MAX = 99

function percent(value: number): string {
  return `${(Math.min(value, SCALE_MAX) / SCALE_MAX) * 100}%`
}

type AttributeBarsProps = {
  attributes: { label: string; value: number | undefined }[]
  potential?: number
}

/**
 * The six attributes drawn on the 1–99 scale, with the potential as a lighter band behind them.
 * It only draws the numbers it receives; nothing is calculated.
 */
export function AttributeBars({ attributes, potential }: AttributeBarsProps) {
  return (
    <div className="grid gap-3">
      <dl className="grid gap-2">
        {attributes.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd aria-hidden className="relative h-1.5 overflow-hidden rounded-full bg-zinc-100">
              {potential !== undefined && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-100"
                  style={{ width: percent(potential) }}
                />
              )}
              {value !== undefined && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-600"
                  style={{ width: percent(value) }}
                />
              )}
            </dd>
            <dd className="text-right tabular-nums">{value ?? '–'}</dd>
          </div>
        ))}
      </dl>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-sm bg-blue-600" />
          Valor do atributo
        </span>
        {potential !== undefined && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-sm bg-blue-100" />
            Até o potencial ({potential}), que nenhum atributo passa
          </span>
        )}
      </p>
    </div>
  )
}
