import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  icon: LucideIcon
  value: string
  unit?: string
  hint: string
}

/** One value returned by the API, big, with what it means below (the KPIs of the club page). */
export function StatCard({ label, icon: Icon, value, unit, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{label}</span>
        <Icon aria-hidden className="size-4" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-1.5 text-sm font-normal text-zinc-500">{unit}</span>}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  )
}
